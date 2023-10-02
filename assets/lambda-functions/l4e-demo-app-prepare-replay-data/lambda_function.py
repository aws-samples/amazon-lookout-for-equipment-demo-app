import boto3
import datetime
import json
import os
import pandas as pd
import pytz
import time
import uuid

l4eClient = boto3.client('lookoutequipment')
s3 = boto3.resource('s3')
s3Client = boto3.client('s3')

samplingRateTable = {
    'PT1S': '1s',
    'PT5S': '5s',
    'PT10S': '10s',
    'PT15S': '15s',
    'PT30S': '30s',
    'PT1M': '1min',
    'PT5M': '5min',
    'PT10M': '10min',
    'PT15M': '15min',
    'PT30M': '30min',
    'PT1H': '1h'
}

frequencyTable = {
    'PT1S': 1,
    'PT5S': 5,
    'PT10S': 10,
    'PT15S': 15,
    'PT30S': 30,
    'PT1M': 60,
    'PT5M': 300,
    'PT10M': 600,
    'PT15M': 900,
    'PT30M': 1800,
    'PT1H': 3600
}

replayDurationTable = {
    '1day': 86400,
    '1week': 86400 * 7,
    '1month': 86400 * 30
}

def lambda_handler(event, context):
    modelName = event['modelName']
    projectName = event['projectName']
    generateReplayData = event['generateReplayData']
    replayDuration = event['replayDuration']
    uid = event['uid']
    
    if generateReplayData:
        response = l4eClient.describe_model(ModelName=modelName)
        samplingRate = samplingRateTable[response['DataPreProcessingConfiguration']['TargetSamplingRate']]
        
        replayStartTime = pd.to_datetime(event['replayStart']).tz_localize(None)
        replayEndTime = getReplayEndTime(replayStartTime, replayDuration)
        frequency = frequencyTable[response['DataPreProcessingConfiguration']['TargetSamplingRate']]
        tagsList = getTagsList(response)
        
        df, timestampCol, bucket = getDataframe(projectName)
        df = df.loc[replayStartTime:replayEndTime, tagsList].resample(samplingRate).mean().ffill()

        
        targetBucket = s3.Bucket(bucket)
    
        start = datetime.datetime.now()
        if frequency > 60:
            start = start - datetime.timedelta(
                minutes=start.minute % (frequency / 60),
                seconds=start.second,
                microseconds=start.microsecond
            )
        else:
            start = start - datetime.timedelta(
                minutes=start.minute,
                seconds=start.second % frequency,
                microseconds=start.microsecond
            )
    
        newIndex = pd.date_range(start=start, periods=df.shape[0], freq=samplingRate)
        numSeq = int((newIndex[-1] - newIndex[0]).total_seconds() / frequency)
        df.index = newIndex
        df.index.name = timestampCol
        df['bucket'] = bucket
        df['modelName'] = modelName
        df['projectName'] = projectName[9:]
        df['uid'] = uid
        
        inference_fname = os.path.join('/tmp', f'{modelName}.csv')
        inference_key = f'inference-data/{modelName}/inference-input.csv'
        df.to_csv(inference_fname)
        targetBucket.upload_file(inference_fname, inference_key)
        
        s3Client.put_object(
            Bucket=bucket,
            Key=f'inference-data/{modelName}/output/TemporaryFile-CanBeDeleted.tmp'
        )
        s3Client.put_object(
            Bucket=bucket,
            Key=f'inference-data/{modelName}/input/TemporaryFile-CanBeDeleted.tmp'
        )
    
        return {
            'statusCode': 200,
            'numInferenceFiles': numSeq,
            'bucket': bucket,
            'key': inference_key,
            'token': str(uuid.uuid4()),
            'name': f'{modelName}-scheduler',
            'modelName': modelName,
            'inputPrefix': f'inference-data/{modelName}/input/',
            'outputPrefix': f'inference-data/{modelName}/output/',
            'generateReplayData': True,
            'replayStartTime': str(replayStartTime),
            'replayEndTime': str(replayEndTime),
            'uid': uid
        }
        
    else:
        response = l4eClient.describe_dataset(DatasetName='l4e-demo-app-' + projectName)
        bucket = response['IngestionInputConfiguration']['S3InputConfiguration']['Bucket']
        s3Client.put_object(
            Bucket=bucket,
            Key=f'inference-data/{modelName}/output/TemporaryFile-CanBeDeleted.tmp'
        )
        s3Client.put_object(
            Bucket=bucket,
            Key=f'inference-data/{modelName}/input/TemporaryFile-CanBeDeleted.tmp'
        )
        
        return {
            'statusCode': 200,
            'bucket': bucket,
            'token': str(uuid.uuid4()),
            'name': f'{modelName}-scheduler',
            'modelName': modelName,
            'inputPrefix': f'inference-data/{modelName}/input/',
            'outputPrefix': f'inference-data/{modelName}/output/',
            'generateReplayData': False,
            'uid': uid
        }
        
def getReplayEndTime(replayStartTime, replayDuration):
    duration = replayDurationTable[replayDuration]
    replayEndTime = replayStartTime + datetime.timedelta(seconds=duration - 1)
    
    return replayEndTime.tz_localize(None)
    
def getTagsList(response):
    schema = eval(response['Schema'])
    signals = schema['Components'][0]['Columns']
    tagsList = []
    for s in signals:
        if s['Name'] == 'timestamp':
            continue
        else:
            tagsList.append(s['Name'])
            
    return tagsList
    
def getDataframe(projectName):
    bucket, datasetS3Key = getDatasetS3Key(projectName)
    data = s3Client.get_object(Bucket=bucket, Key=datasetS3Key)
    df = pd.read_csv(data['Body'])
    timestampCol = list(df.columns)[0]
    
    df[timestampCol] = pd.to_datetime(df[timestampCol])
    df = df.set_index(timestampCol)
    
    return df, timestampCol, bucket

def getDatasetS3Key(projectName):
    datasetResponse = None
    datasetCsvS3Key = ""
    
    response = l4eClient.describe_dataset(DatasetName='l4e-demo-app-' + projectName)

    bucket = response['IngestionInputConfiguration']['S3InputConfiguration']['Bucket']
    prefix = response['IngestionInputConfiguration']['S3InputConfiguration']['Prefix'] + projectName[9:] + '/'
    
    response = s3Client.list_objects_v2(
        Bucket=bucket,
        Prefix=prefix
    )
    
    return bucket,response['Contents'][0]['Key']