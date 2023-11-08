import boto3
import json
import os
import uuid
import time

sts_client = boto3.client('sts')
iam = boto3.resource('iam')

def lambda_handler(event, context):
    print('Event:', event)
    print('Context:', context)
    print('=========================================')

    try:
        sourceBucket = event['sourceBucket']
        sourcePrefix = event['sourcePrefix']
        targetBucket = event['targetBucket']
        targetPrefix = event['targetPrefix']
        createRole = event['createRole']
        
        if (createRole):
            execution_role_arn = os.environ['EXECUTION_ROLE']
            iam_client = boto3.client('iam')
            uid = str(uuid.uuid4()).split('-')[0]
            role_name = f'L4EDemoApp-CopyCSVFromS3-{uid}'
            
            response = iam_client.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": { "AWS": execution_role_arn },
                        "Action": "sts:AssumeRole"
                    }]
                })
            )
            assumedRole = response['Role']['Arn']
            
            iam_client.put_role_policy(
                RoleName=role_name,
                PolicyName='S3SourceAccess',
                PolicyDocument=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": ["s3:GetObject", "s3:GetObjectAcl"],
                        "Resource": f"arn:aws:s3:::{sourceBucket}/{sourcePrefix}"
                    }]
                })
            )
            
            iam_client.put_role_policy(
                RoleName=role_name,
                PolicyName='S3TargetAccess',
                PolicyDocument=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": ["s3:PutObject", "s3:PutObjectAcl", "s3:PutObjectTagging"],
                        "Resource": f"arn:aws:s3:::{targetBucket}/*"
                    }]
                })
            )
            
            print('Propagating IAM role creation...')
            time.sleep(15)
            print('Done.')
            
        else:
            assumedRole = event['existingRole']
            'arn:aws:iam::905637044774:role/L4EDemoApp-CopyCSVFromS3'
    
        # Creating a session to assume this role
        response = sts_client.assume_role(
            RoleArn=assumedRole,
            RoleSessionName="l4edemoapp-csv-from-s3-session"
        )
        ACCESS_KEY = response['Credentials']['AccessKeyId']
        SECRET_KEY = response['Credentials']['SecretAccessKey']
        SESSION_TOKEN = response['Credentials']['SessionToken']
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=ACCESS_KEY,
            aws_secret_access_key=SECRET_KEY,
            aws_session_token=SESSION_TOKEN,
        )
    
        # Try to run the copy:
        s3_client.copy_object(
            ACL='bucket-owner-full-control',
            Bucket=targetBucket,
            Key=targetPrefix,
            CopySource=f'{sourceBucket}/{sourcePrefix}'
        )
        
        # We need the following tags on this file:
        s3_client.put_object_tagging(
            Bucket=targetBucket,
            Key=targetPrefix,
            Tagging={
                'TagSet': [
                    { 'Key': 'L4EDemoAppUser' , 'Value': event['uid']},
                    { 'Key': 'AssetDescription', 'Value': event['assetDescription']}
                ]
            }
        )
        
        if (createRole):
            print('### Deleting role: ###')
            role_policy = iam.RolePolicy(role_name,'S3SourceAccess')
            role_policy.delete()
            role_policy = iam.RolePolicy(role_name,'S3TargetAccess')
            role_policy.delete()
            time.sleep(3)
            response = iam_client.delete_role(RoleName=role_name)
            
            print(response)
        
    except Exception as e:
        raise(e)
        return {
            "errorMessage": str(e),
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Origin": os.environ['ORIGIN'],
                "Access-Control-Allow-Methods": "*" 
            }
        }
    
    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": os.environ['ORIGIN'],
            "Access-Control-Allow-Methods": "*" 
        }
    }
