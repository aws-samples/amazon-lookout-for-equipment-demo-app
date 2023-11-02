import boto3
import pandas as pd
import uuid
import os
import csv

s3_client = boto3.client('s3')
s3 = boto3.resource('s3')

def lambda_handler(event, context):
    print(event)
    print('-----------------------------------')
    
    # Assembling the S3 path to process:
    bucket = event['detail']['bucket']['name']
    key = event['detail']['object']['key']
    asset = key.split('/')[-2]

    # Guessing the CSV delimiter:
    data = s3_client.get_object(Bucket=bucket, Key=key, Range='bytes=0-10239')
    sniffer = csv.Sniffer()
    data = data['Body'].read().decode('utf-8')
    data = data.split('\n')[0]
    delimiter = sniffer.sniff(data).delimiter
    print('Detected delimiter:', delimiter)

    # Reading the CSV file:
    data = s3_client.get_object(Bucket=bucket, Key=key)
    df = pd.read_csv(data['Body'], delimiter=delimiter)
    timestampCol = list(df.columns)[0]
    df[timestampCol] = pd.to_datetime(df[timestampCol])
    df = df.set_index(timestampCol)
    df = df.sort_index()
    df.index.name = "timestamp"
    df.index = df.index.tz_localize('utc').tz_convert(None)
    
    print('Original data ingested in L4E:')
    print(df.shape)
    print(df.head())
    print(df.tail())
    print('-----------------------------------')

    # Reading tags on the object
    tags = s3_client.get_object_tagging(Bucket=bucket, Key=key)['TagSet']
    userUid = ""
    assetDescription = ""
    for tag in tags:
        if tag['Key'] == 'L4EDemoAppUser':
            userUid = tag['Value']
        if tag['Key'] == 'AssetDescription':
            assetDescription = tag['Value']

    # Resampling to hourly: we limit gap fillings to one day:
    df_hourly = df.resample('1H').mean().ffill(limit=24)
    df_hourly = df_hourly.dropna(axis='index', how='all')
    df_hourly = df_hourly.fillna(value=0.0)

    print('Hourly data stored in DynamoDB')
    print(df_hourly.shape)
    print(df_hourly.head())
    print(df_hourly.tail())
    print('-----------------------------------')

    # Adding columns:
    df_hourly['asset'] = asset
    df_hourly['sampling_rate'] = '1h'
    df_hourly = df_hourly.reset_index()
    df_hourly['unix_timestamp'] = (df_hourly['timestamp'] - pd.Timestamp('1970-01-01')) // pd.Timedelta('1s')
    df_hourly['unix_timestamp'] = df_hourly['unix_timestamp'].astype(float)
    df_hourly = df_hourly[['timestamp', 'unix_timestamp', 'asset', 'sampling_rate'] + list(df_hourly.columns)[1:-3]]
    
    # Writing the new file
    local_fname = f'/tmp/{asset}_prepared.csv'
    df_hourly.to_csv(local_fname, index=None)
    target_bucket = s3.Bucket(bucket)
    target_key = f'prepared-datasets/{asset}/{asset}_prepared.csv'
    import_key = f'prepared-datasets/{asset}/'
    target_bucket.upload_file(local_fname, target_key)
    
    # Keeping a snapshot of the raw data that we will
    # display in the project dashboard screen:
    df_summary = pd.concat([df.head(20), df.tail(20)], axis='index')
    df_summary['asset'] = asset
    df_summary['sampling_rate'] = 'summary'
    df_summary = df_summary.reset_index()
    df_summary['unix_timestamp'] = (df_summary['timestamp'] - pd.Timestamp('1970-01-01')) // pd.Timedelta('1s')
    df_summary['unix_timestamp'] = df_summary['unix_timestamp'].astype(float)
    df_summary = df_summary[['timestamp', 'unix_timestamp', 'asset', 'sampling_rate'] + list(df_summary.columns)[1:-3]]
    field_types = {f: 'S' for f in list(df_summary.columns)}
    field_types.update({'unix_timestamp': 'N'})

    local_fname = f'/tmp/{asset}_summary.csv'
    df_summary.to_csv(local_fname, index=None)
    target_bucket = s3.Bucket(bucket)
    target_key = f'prepared-datasets/{asset}/{asset}_summary.csv'
    target_bucket.upload_file(local_fname, target_key)

    # Writing an update for the initial file 
    # with the right timestamp column name:
    local_fname = f'/tmp/{asset}_raw.csv'
    df.to_csv(local_fname)
    target_key = f'raw-datasets/{asset}/{asset}/sensors.csv'
    target_bucket.upload_file(local_fname, target_key)

    return {
        'statusCode': 200,
        'bucket': bucket,
        'key': f'prepared-datasets/{asset}/{asset}_prepared.csv',
        'summaryKey': f'prepared-datasets/{asset}/{asset}_summary.csv',
        'importKey': import_key,
        'asset': asset,
        'L4ES3InputPrefix': 'raw-datasets/' + asset + '/',
        'L4EClientToken': str(uuid.uuid4()),
        'L4EDatasetName': f'l4e-demo-app-{userUid}-{asset}',
        'userUid': userUid,
        'assetDescription': assetDescription,
        'tableName': f'l4edemoapp-{userUid}-{asset}',
        'fieldTypes': field_types
    }