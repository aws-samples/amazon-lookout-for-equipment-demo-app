import boto3
import json
import pandas as pd
import urllib

from datetime import datetime

l4e_client = boto3.client('lookoutequipment')
s3_client = boto3.client('s3')
ddb_client = boto3.client('dynamodb')

# =========================================================================
# This Lambda function is called whenever a new Lookout for Equipment
# inference results is pushed to the output prefix of the demo application.
# When this happens, this function will locate the corresponding input file
# and push its content (the live time series) to the DynamoDB table where
# the timeseries are stored.
# =========================================================================
def lambda_handler(event, context):
    # Locate the input file used to run the inference:
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])

    timestamp = key.split('/')[-2][:-1].replace('-', '').replace(':', '').replace('T', '')
    modelName = key.split('/')[1]
    response = l4e_client.describe_model(ModelName=modelName)
    uid = response['DatasetName'][13:].split('-')[0]
    projectName = response['DatasetName'][22:]
    inferenceInputKey = '/'.join(key.split('/')[0:2]) + f'/input/{projectName}-{timestamp}.csv'

    # Read the input CSV file:
    data = s3_client.get_object(Bucket=bucket, Key=inferenceInputKey)
    df = pd.read_csv(data['Body'])

    # Add new columns:
    timestampCol = list(df.columns)[0]
    df = df.rename(columns={timestampCol: 'timestamp'})
    # df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['sampling_rate'] = 'raw'
    df['asset'] = projectName
    df['unix_timestamp'] = (pd.to_datetime(df['timestamp']) - pd.Timestamp('1970-01-01')) // pd.Timedelta('1s')
    df['unix_timestamp'] = df['unix_timestamp'].astype(float)
    
    # === TODO === Optimize the following ingestion with the batch PutItems() API
    
    # Ingest this content in DynamoDB: the inference input file will contain few 
    # rows (1 in the case of synthetic inference data, and up to 3600 in case of
    # the largest inference period (1 hour):
    for index, row in df.iterrows():
        item = {}
        for key, values in eval(row.to_json()).items():
            if key == 'unix_timestamp':
                item.update({key: {'N': str(values)}})
            else:
                item.update({key: {'S': str(values)}})
                
        ddb_client.put_item(TableName=f'l4edemoapp-{uid}-{projectName}', Item=item)
    
    return {
        'statusCode': 200,
        'modelName': modelName,
        'datasetName': projectName,
        'inferenceInputKey': inferenceInputKey
    }
