import boto3
import json
import os

from datetime import timezone

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    print('Event:', event)
    print('Context:', context)
    print('=========================================')
    
    response = s3_client.list_objects_v2(
        Bucket=event['bucketName'],
        Prefix=event['pathPrefix'],
        Delimiter='/'
    )
    
    listFolders = []
    if ('CommonPrefixes' in response.keys()):
        for folder in response['CommonPrefixes']:
            listFolders.append({
                "Folder": folder['Prefix']
            })
    
    listObjects = []
    if ('Contents' in response.keys()):
        for object in response['Contents']:
            listObjects.append({
                "Key": object['Key'],
                "LastModified": object['LastModified'].replace(tzinfo=timezone.utc).timestamp(),
                "Size": object['Size']
            })

    return {
        "statusCode": 200,
        "body": json.dumps({
            "folders": listFolders,
            "files": listObjects
        }),
        "headers": {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": os.environ['ORIGIN'],
            "Access-Control-Allow-Methods": "*" 
        }
    }