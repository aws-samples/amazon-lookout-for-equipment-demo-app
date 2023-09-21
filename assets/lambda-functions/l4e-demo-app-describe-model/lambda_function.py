import boto3
from datetime import datetime

l4e_client = boto3.client('lookoutequipment')

def lambda_handler(event, context):
    modelName = event['modelName']
    modelDescription = l4e_client.describe_model(ModelName=modelName)
    status = modelDescription['Status']

    return {
        'statusCode': 200,
        'status': status,
        'modelName': modelName
    }
