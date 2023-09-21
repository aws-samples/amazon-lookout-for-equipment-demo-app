import json

def lambda_handler(event, context):
    bucket = event['Records'][0]['s3']['bucket']['name']
    prefix = event['Records'][0]['s3']['object']['key']
    
    print('-----')
    print(event)
    print(bucket, ', ', prefix)
    print('-----')
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
