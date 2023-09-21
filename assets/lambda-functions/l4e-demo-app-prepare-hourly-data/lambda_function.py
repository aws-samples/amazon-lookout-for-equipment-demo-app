import boto3
import pandas as pd
import uuid
import os

s3_client = boto3.client('s3')
s3 = boto3.resource('s3')

def lambda_handler(event, context):
    # Assembling the S3 path to process:
    bucket = event['detail']['bucket']['name']
    key = event['detail']['object']['key']
    asset = key.split('/')[-2]
            
    # Reading the CSV file:
    data = s3_client.get_object(Bucket=bucket, Key=key)
    df = pd.read_csv(data['Body'])
    timestampCol = list(df.columns)[0]
    df[timestampCol] = pd.to_datetime(df[timestampCol])
    df = df.set_index(timestampCol)
    df.index.name = "timestamp"
    
    # Reading tags on the object
    tags = s3_client.get_object_tagging(Bucket=bucket, Key=key)['TagSet']
    userUid = ""
    assetDescription = ""
    for tag in tags:
        if tag['Key'] == 'L4EDemoAppUser':
            userUid = tag['Value']
        if tag['Key'] == 'AssetDescription':
            assetDescription = tag['Value']

    # Resampling and adding columns:
    df_hourly = df.resample('1H').mean().ffill().fillna(value=0.0)
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
        'importKey': import_key,
        'asset': asset,
        'L4ES3InputPrefix': 'raw-datasets/' + asset + '/',
        'L4EClientToken': str(uuid.uuid4()),
        'L4EDatasetName': f'l4e-demo-app-{userUid}-{asset}',
        'userUid': userUid,
        'assetDescription': assetDescription,
        'tableName': f'l4edemoapp-{userUid}-{asset}',
    }