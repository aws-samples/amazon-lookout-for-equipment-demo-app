import boto3
import csv
import json

from datetime import datetime

s3 = boto3.resource('s3')

def lambda_handler(event, context):
    timestamp = datetime.strptime(event['timestamp'], "%Y-%m-%d %H:%M:%S")
    currentTimestamp = timestamp.strftime(format='%Y%m%d%H%M%S')
    tagsList = event.keys()
    bucket = event['bucket']
    modelName = event['modelName']
    projectName = event['projectName']
    uid = event['uid']
    
    row = dict()
    row.update({'timestamp': event['timestamp']})
    for tag in tagsList:
        if (tag != 'timestamp' and tag != 'bucket' and tag != 'modelName' and tag != 'projectName' and tag !='uid'):
            row.update({tag: event[tag]})
            
    localFname = f'/tmp/{projectName}-{currentTimestamp}.csv'
    data = open(localFname, 'w')
    csvWriter = csv.writer(data)
    csvWriter.writerow(row.keys())
    csvWriter.writerow(row.values())
    data.close()
    
    targetBucket = s3.Bucket(bucket)
    inferenceKey = f'inference-data/{uid}-{modelName}/input/{projectName}-{currentTimestamp}.csv'
    targetBucket.upload_file(localFname, inferenceKey)

    return { 'statusCode': 200 }
