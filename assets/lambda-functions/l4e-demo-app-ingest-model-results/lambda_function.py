import boto3
import json
import time

s3_client = boto3.client('s3')
ddb_client = boto3.client('dynamodb')

def lambda_handler(event, context):
    bucket = event['bucket']
    key = event['key']
    table = event['table']
    fieldTypes = event['fieldTypes']
    
    result = ddbTableExists(table)
    if not result: 
        print(f'Table {table} does not exist, creating it...')
        result = ddbCreateTable(table)

    # Reading the CSV file:
    print(f'Ingesting data into the {table} table')
    data = s3_client.get_object(Bucket=bucket, Key=key)
    data = data['Body'].read().decode("utf-8")
    
    # Excluding the last row which will be empty. Reading the 
    # headers and then excluding them from the main body of 
    # rows to process:
    rows = data.split("\n")[:-1]
    headers = rows[0].split(',')
    rows = rows[1:]
    
    # We then batch the ingestion by 25 items (maximum batch 
    # for the DynamoDB BatchWriteItem API call):
    numBatches = int(len(rows) / 25)

    # Loops through each batch of rows to ingest:
    for i in range(0, numBatches + 1):
        # Extract the current rows content:
        currentRows = rows[i * 25 : (i+1) * 25]
        
        try:
            # Assemble the request:
            putRequests = [{
                'PutRequest': {
                    'Item': {
                        h: {fieldTypes[h]: r.split(',')[index]} for index, h in enumerate(headers)
                    }
                }
            } for r in currentRows]
            
            # And write this batch until there are no more unprocessed items:
            response = ddb_client.batch_write_item(
                RequestItems={
                    table: putRequests
                }
            )
            while (len(response['UnprocessedItems']) > 0):
                response = ddb_client.batch_write_item(
                    RequestItems={
                        table: response['UnprocessedItems'][table]
                    }
                )
            
        # In case of exception, we print some context and issue the error:
        except Exception as e:
            print('Num rows to ingest:', len(rows))
            print('Current row that triggered the exception:', currentRows)
            print('Batch: ', i)
            print('Error:', e)
    
    # At the end of the process, we delete the source file:
    try:
        response = s3_client.delete_object(Bucket=bucket, Key=key)
        
    except Exception as e:
        print(e)
    
    return {
        'statusCode': 200,
    }

def ddbTableExists(tableName):
    try:
        response = ddb_client.describe_table(TableName=tableName)
        
    except Exception as e:
        return False

    return response['Table']['TableStatus']
    
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