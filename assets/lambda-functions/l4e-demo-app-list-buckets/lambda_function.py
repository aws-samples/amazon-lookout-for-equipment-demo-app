import boto3
import json
import os

from datetime import timezone

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    print('Event:', event)
    print('Context:', context)
    print('=========================================')
    
    response = s3_client.list_buckets()
    
    listBuckets = []
    if ('Buckets' in response.keys()):
        for bucket in response['Buckets']:
            print(bucket)
            listBuckets.append({
                "Name": bucket['Name'],
                "CreationDate": bucket['CreationDate'].replace(tzinfo=timezone.utc).timestamp()  
            })

    return {
        "statusCode": 200,
        "body": json.dumps(listBuckets),
        "headers": {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": os.environ['ORIGIN'],
            "Access-Control-Allow-Methods": "*" 
        }
    }