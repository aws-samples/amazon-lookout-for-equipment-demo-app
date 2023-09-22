import boto3
import os
import pandas as pd
import uuid

s3_client = boto3.client('s3')
s3 = boto3.resource('s3')
ddb_client = boto3.client('dynamodb')

def lambda_handler(event, context):
    # Assembling the S3 path to process:
    bucket = event['bucket']
    key = event['key']
    asset = key.split('/')[-2]
    executionId = event['id']
    stackId = os.environ['STACK_ID']
    
    # Reading the CSV file:
    try:
        # Reading dataset num rows:
        data = s3_client.get_object(Bucket=bucket, Key=key)
        df = pd.read_csv(data['Body'])
        numRows = df.shape[0]
    
        # Reading tags on the object
        tags = s3_client.get_object_tagging(Bucket=bucket, Key=key)['TagSet']
        userUid = ""
        assetDescription = ""
        for tag in tags:
            if tag['Key'] == 'L4EDemoAppUser':
                userUid = tag['Value']
            if tag['Key'] == 'AssetDescription':
                assetDescription = tag['Value']
        
        # Create a new entry in the projects table:
        ddb_client.put_item(
            TableName=f'l4edemoapp-projects-{stackId}',
            Item={
                'user_id': {'S': userUid},
                'project': {'S': asset},
                'numRows': {'N': str(numRows)},
                'executionId': {'S': executionId},
                'assetDescription': {'S': assetDescription},
            }
        )
        
        return {'statusCode': 200}
        
    except Exception as e:
        return {
            'statusCode': 400,
            'errorMessage': 'Error while reading the CSV file, check your file and try again'
        }