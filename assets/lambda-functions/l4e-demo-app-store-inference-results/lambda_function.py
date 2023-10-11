import boto3
import json
import pandas as pd
import urllib

from datetime import datetime

l4e_client = boto3.client('lookoutequipment')
s3_client = boto3.client('s3')
ddb_client = boto3.client('dynamodb')

# ====================================================================
# This lambda function is called whenever a new Lookout for Equipment
# inference results is pushed to the output prefix of the demo
# application. This function pushes the JSONL content to the DynamoDB
# tables storing the inference results.
# ===================================================================
def lambda_handler(event, context):
    print(event)
    print('-----------------------------------------')
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
    modelName = key.split('/')[1]
    response = l4e_client.describe_model(ModelName=modelName)
    projectName = response['DatasetName'][13:]
    
    # === TODO === Optimize the following ingestion with the batch PutItems() API
    
    # Inference output is in JSON lines, with last line being empty:
    inferenceData = s3_client.get_object(Bucket=bucket, Key=key)
    inferenceData = inferenceData['Body'].read().decode('utf-8')
    
    for data in inferenceData.split('\n')[:-1]:
        data = json.loads(data)
    
        # Get the current unix timestamp:
        timestamp = data['timestamp'][:19].replace('T', ' ')
        timestamp = int(datetime.timestamp(datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')))
        
        # Write the anomaly to the l4edemoapp-anomalies DynamoDB table:
        anomaly = data['prediction']
        storeAnomaly(modelName, timestamp, anomaly, projectName)
        
        # Write the raw anomaly score to the 
        # l4edemoapp-raw-anomalies DynamoDB table:
        score = data['anomaly_score']
        storeRawAnomaly(modelName, timestamp, score, projectName)
        
        # Write the diagnostic data to the l4edemoapp-XXX-sensor_contribution
        # DynamoDB table where XXX is the name of the dataset / project:
        if ('diagnostics' in data.keys()):
            print('Processing diagnostics data')
            storeSensorContribution(modelName, timestamp, data['diagnostics'], projectName)
        else:
            print('No diagnostics data to process')

    # Processing input file:
    timestamp = key.split('/')[-2][:-1].replace('-', '').replace(':', '').replace('T', '')
    inferenceInputKey = '/'.join(key.split('/')[0:2]) + f'/input/{projectName[9:]}-{timestamp}.csv'
    storeInput(bucket, inferenceInputKey, projectName)

    return {
        'statusCode': 200,
        'bucket': bucket,
        'file': key,
        'modelName': modelName
    }
    
def storeInput(bucket, inferenceInputKey, projectName):
    data = s3_client.get_object(Bucket=bucket, Key=inferenceInputKey)
    df = pd.read_csv(data['Body'])

    # Add new columns:
    timestampCol = list(df.columns)[0]
    df = df.rename(columns={timestampCol: 'timestamp'})
    df['sampling_rate'] = 'raw'
    df['asset'] = projectName[9:]
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
                
        ddb_client.put_item(TableName=f'l4edemoapp-{projectName}', Item=item)

def storeAnomaly(model, timestamp, anomaly, project):
    ddb_client.put_item(
        TableName=f'l4edemoapp-{project}-anomalies',
        Item={
            'model': {'S': model},
            'timestamp': {'N': str(timestamp)},
            'anomaly': {'N': str(anomaly)}
        }
    )
    
def storeRawAnomaly(model, timestamp, raw_anomaly, project):
    table = f'l4edemoapp-{project}-raw-anomalies'
    result = ddbTableExists(table)
    if not result: 
        print(f'Table {table} does not exist, creating it...')
        result = ddbCreateTable(table)
        
    ddb_client.put_item(
        TableName=table,
        Item={
            'model': {'S': model},
            'timestamp': {'N': str(timestamp)},
            'anomaly_score': {'N': str(raw_anomaly)}
        }
    )
    
def storeSensorContribution(model, timestamp, diagnostics, project):
    items = {
        'model': {'S': model},
        'timestamp': {'N': str(timestamp)}
    }
    for sensorContribution in diagnostics:
        tag = sensorContribution['name'].split('\\')[1]
        value = sensorContribution['value']
        
        items.update({tag: {'N': str(value)}})
        
    ddb_client.put_item(
        TableName=f'l4edemoapp-{project}-sensor_contribution',
        Item=items
    )
    
# ---------------------------------
# Checks if a DynamoDB table exists
# ---------------------------------
def ddbTableExists(tableName):
    try:
        response = ddb_client.describe_table(TableName=tableName)
        
    except Exception as e:
        return False

    return response['Table']['TableStatus']
    
# ------------------------
# Creates a DynamoDB table
# ------------------------
def ddbCreateTable(tableName):
    print(tableName)
    
    try:
        response = ddb_client.create_table(
            TableName=tableName,
            AttributeDefinitions=[
                {
                    'AttributeName': 'model',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'timestamp',
                    'AttributeType': 'N'
                }
            ],
            KeySchema=[
                {
                    'AttributeName': 'model',
                    'KeyType': 'HASH'
                },
                {
                    'AttributeName': 'timestamp',
                    'KeyType': 'RANGE'
                }
            ],
            BillingMode='PAY_PER_REQUEST',
            TableClass='STANDARD'
        )
    except Exception as e:
        print(e)

    response = ddb_client.describe_table(TableName=tableName)
    status = response['Table']['TableStatus']
    
    while status != 'ACTIVE':
        time.sleep(1)
        response = ddb_client.describe_table(TableName=tableName)
        status = response['Table']['TableStatus']
        print('Table creation status:', status)
        
    return status