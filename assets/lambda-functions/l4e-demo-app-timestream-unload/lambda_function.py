import boto3
import os
import uuid

timestream_client = boto3.client('timestream-query')
ddb_client = boto3.client('dynamodb')

def lambda_handler(event, context):
    print(event)
    print('===============================')
    
    query = event['unloadQuery']
    bucket = event['detail']['bucket']['name']
    targetKey = event['detail']['object']['key']
    unloadKey = event['detail']['unloadObject']['key']
    assetDescription = event['assetDescription']
    stackId = os.environ['STACK_ID']
    asset = targetKey.split('/')[-2]
    executionId = event['id']
    
    print(query)
    response = timestream_client.query(
        QueryString=query,
        ClientToken=uuid.uuid4().hex
    )
    
    print(response)
    print('===============================')
    
    # Create a new entry in the projects table:
    ddb_client.put_item(
        TableName=f'l4edemoapp-projects-{stackId}',
        Item={
            'user_id': {'S': event['uid']},
            'project': {'S': asset},
            'numRows': {'N': '0'},
            'executionId': {'S': executionId},
            'assetDescription': {'S': assetDescription},
        }
    )
    
    return {
        'uid': event['uid'],
        'assetDescription': assetDescription,
        'datasetPreparationSfnArn': event['datasetPreparationSfnArn'],
        'timestampCol': event['timestampCol'],
        'detail': {
            'bucket': { 'name': bucket },
            'object': { 'key': targetKey },
            'unloadObject': { 'key': unloadKey }
        }
    }