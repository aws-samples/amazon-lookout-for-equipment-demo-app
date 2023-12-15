import boto3
import json
import numpy as np
import os
import pandas as pd

l4e_client = boto3.client('lookoutequipment')
s3 = boto3.resource('s3')

def lambda_handler(event, context):
    samplingRate = '5min'
    aggregationLevel = '1D'
    bucket = os.environ['BUCKET']
    
    modelName = event['modelName']
    modelDescription = l4e_client.describe_model(ModelName=modelName)
    datasetName = modelDescription['DatasetName']
    assetName = datasetName[len('l4e-demo-app-'):]
    startTime = pd.to_datetime(modelDescription['TrainingDataStartTime']).tz_localize(None)
    endTime = pd.to_datetime(modelDescription['EvaluationDataEndTime']).tz_localize(None)
    schema = modelDescription['Schema']
    tagsList = getTags(json.loads(schema))
    predictedRanges = json.loads(modelDescription['ModelMetrics'])['predicted_ranges']

    if len(predictedRanges) > 0:
        predictedRanges = pd.DataFrame(predictedRanges)
        predictedRanges['start'] = pd.to_datetime(predictedRanges['start'])
        predictedRanges['end'] = pd.to_datetime(predictedRanges['end'])
    else:
        predictedRanges = pd.DataFrame(columns=['start', 'end'])
    
    # Anomalies:
    anomaliesDataframe = convert_ranges(
        predictedRanges,
        startTime,
        endTime,
        samplingRate
    )

    # Daily rate:
    df = anomaliesDataframe.copy()
    currentDay = df.reset_index()['index'].dt.strftime('%Y-%m-%d')
    currentDay.index = df.index
    df['day'] = pd.to_datetime(currentDay)
    dailyRateDataframe = df.groupby('day').sum()
    
    # Sensor contribution:
    sensorContributionDataframe = buildSensorContribution(
        predictedRanges, 
        tagsList,
        assetName,
        anomaliesDataframe,
        samplingRate,
        aggregationLevel
    )

    # Upload the files to S3:
    csvKeys = uploadCSVtoS3(
        anomaliesDataframe,
        dailyRateDataframe,
        sensorContributionDataframe,
        bucket,
        assetName,
        modelName
    )
    
    filesToIngest = [
        {
            'bucket': bucket, 
            'table': f'l4edemoapp-{assetName}-anomalies', 
            'key': csvKeys['anomaliesKey'], 
            'fieldTypes': csvKeys['anomaliesFields'],
        }, 
        {
            'bucket': bucket, 
            'table': f'l4edemoapp-{assetName}-daily_rate', 
            'key': csvKeys['dailyRateKey'], 
            'fieldTypes': csvKeys['dailyRateFields']
        }
    ]
    
    if sensorContributionDataframe is not None:
        filesToIngest.append({
            'bucket': bucket, 
            'table': f'l4edemoapp-{assetName}-sensor_contribution', 
            'key': csvKeys['sensorContributionKey'], 
            'fieldTypes': csvKeys['sensorContributionFields']
        })
    
    return {
        'statusCode': 200,
        'bucket': bucket,
        'startTime': str(startTime),
        'endTime': str(endTime),
        'filesToIngest': filesToIngest
    }
    
def uploadCSVtoS3(anomalies, dailyRate, sensorContribution, bucket, asset, model):
    fname = '/tmp/anomalies.csv'
    anomalies.index.name = 'timestamp'
    anomalies = anomalies.reset_index()
    anomalies['timestamp'] = (anomalies['timestamp'] - pd.Timestamp('1970-01-01')) // pd.Timedelta('1s')
    anomalies.columns = ['timestamp', 'anomaly']
    # anomalies['model'] = asset[9:] + '|' + model
    anomalies['model'] = model
    anomaliesFields = {f: 'S' for f in list(anomalies.columns)[1:]}
    anomaliesFields.update({'timestamp': 'N'})
    anomalies.to_csv(fname, index=None)
    targetBucket = s3.Bucket(bucket)
    anomaliesKey = f'model-results/{asset}/anomalies.csv'
    targetBucket.upload_file(fname, anomaliesKey)
    
    fname = '/tmp/daily_rate.csv'
    dailyRate.index.name = 'timestamp'
    dailyRate = dailyRate.reset_index()
    dailyRate['timestamp'] = (dailyRate['timestamp'] - pd.Timestamp('1970-01-01')) // pd.Timedelta('1s')
    dailyRate.columns = ['timestamp', 'anomaly']
    # dailyRate['model'] = asset[9:] + '|' + model
    dailyRate['model'] = model
    dailyRate.to_csv(fname, index=None)
    dailyRateKey = f'model-results/{asset}/daily_rate.csv'
    targetBucket.upload_file(fname, dailyRateKey)
    dailyRateFields = {f: 'S' for f in list(dailyRate.columns)[1:]}
    dailyRateFields.update({'timestamp': 'N'})
    
    if sensorContribution is not None:
        fname = '/tmp/sensor_contribution.csv'
        sensorContribution.index.name = 'timestamp'
        sensorContribution = sensorContribution.reset_index()
        sensorContribution['timestamp'] = (sensorContribution['timestamp'] - pd.Timestamp('1970-01-01')) // pd.Timedelta('1s')
        # sensorContribution['model'] = asset[9:] + '|' + model
        sensorContribution['model'] = model
        sensorContribution.to_csv(fname, index=None)
        sensorContributionKey = f'model-results/{asset}/sensor_contribution.csv'
        targetBucket.upload_file(fname, sensorContributionKey)
        sensorContributionFields = {f: 'S' for f in list(sensorContribution.columns)[1:]}
        sensorContributionFields.update({'timestamp': 'N'})
    
        return {
            'anomaliesKey': anomaliesKey,
            'anomaliesFields': anomaliesFields,
            'dailyRateKey': dailyRateKey,
            'dailyRateFields': dailyRateFields,
            'sensorContributionKey': sensorContributionKey,
            'sensorContributionFields': sensorContributionFields
        }
        
    else:
        return {
            'anomaliesKey': anomaliesKey,
            'anomaliesFields': anomaliesFields,
            'dailyRateKey': dailyRateKey,
            'dailyRateFields': dailyRateFields
        }

def convert_ranges(ranges_df, start_date, end_date, default_freq):
    """
    This method expands a list of ranges into an datetime index 
    pandas.Series
    
    Parameters:
        ranges_df (pandas.DataFrame):
            A dataframe with two columns, the start and end timestamp of
            each event
        default_freq (string):
            The default frequency to generate the time range for. This will
            be used to generate the DateTimeIndex for this pandas.Series
            
    Returns:
        pandas.DataFrame: a dataframe with a DateTimeIndex spanning from the
        minimum to the maximum timestamps present in the input dataframe.
        This will be a single Series named "Label" where a value of 1.0
        will correspond to the presence of an event (labels or anomalies).
    """
    
    range_index = pd.date_range(
        start=start_date,
        end=end_date, 
        freq=default_freq
    )
    range_data = pd.DataFrame(index=range_index)
    range_data.loc[:, 'Anomaly'] = 0.0

    for _, row in ranges_df.iterrows():
        event_start = row[0]
        event_end = row[1]
        if (event_start == event_end):
            event_end = event_start + pd.Timedelta(default_freq)
        range_data.loc[event_start:event_end, 'Anomaly'] = 1.0
        
    return range_data
    
def getTags(schema):
    columns = schema['Components'][0]['Columns']

    tagsList = []
    for tag in columns:
        if (tag['Type'] != 'DATETIME'):
            tagsList.append(tag['Name'])
            
    return tagsList
    
def expandResults(predictedRanges, tagsList, assetName, samplingRate, aggregationLevel):
    expandedResults = []
    for index, row in predictedRanges.iterrows():
        newRow = dict()
        newRow.update({'start': row['start']})
        newRow.update({'end': row['end']})
        newRow.update({'prediction': 1.0})

        diagnostics = pd.DataFrame(row['diagnostics'])
        diagnostics = dict(zip(diagnostics['name'], diagnostics['value']))
        newRow = {**newRow, **diagnostics}

        expandedResults.append(newRow)

    expandedResults = pd.DataFrame(expandedResults)
    
    dfList = []
    for index, row in expandedResults.iterrows():
        newIndex = pd.date_range(start=row['start'], end=row['end'], freq=samplingRate)
        newDataframe = pd.DataFrame(index=newIndex)

        for tag in tagsList:
            if (f'{assetName[9:]}\\{tag}' in list(row.index)):
                newDataframe[tag] = row[f'{assetName[9:]}\\{tag}']
            else:
                newDataframe[tag] = np.nan

        dfList.append(newDataframe)
    
    if len(dfList) > 0:
        expandedResults = pd.concat(dfList, axis='index')
    else:
        expandedResults = None
    
    return expandedResults
    
def buildSensorContribution(predictedRanges, tagsList, assetName, anomaliesDataframe, samplingRate, aggregationLevel):
    sensorContributionDataframe = expandResults(
        predictedRanges, 
        tagsList, 
        assetName, 
        samplingRate, 
        aggregationLevel
    )
    
    if sensorContributionDataframe is not None:
        sensorContributionDataframe = sensorContributionDataframe.resample(aggregationLevel).mean()
        new_index = anomaliesDataframe.resample(aggregationLevel).mean().index
        sensorContributionDataframe = sensorContributionDataframe.reindex(new_index)
        sensorContributionDataframe = sensorContributionDataframe.replace(to_replace=np.nan, value=0.0)
        sensorContributionDataframe.index.name = 'day'
    
    return sensorContributionDataframe