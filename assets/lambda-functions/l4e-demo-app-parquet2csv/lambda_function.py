import awswrangler as wr
import boto3
import time

s3_client = boto3.client('s3')
s3 = boto3.resource('s3')

def lambda_handler(event, context):
    print(event)
    print("================================")
    
    bucket = event['detail']['bucket']['name']
    prefix = event['detail']['object']['key']
    unloadPrefix = event['detail']['unloadObject']['key'] + "results"
    
    waitForManifest(bucket, event['detail']['unloadObject']['key'])
    
    uid = event['uid']
    assetDescription = event['assetDescription']
    timestampCol = event['timestampCol']
    
    # Read the parquet dataset:
    df = wr.s3.read_parquet(path=f's3://{bucket}/{unloadPrefix}/')
    print(df.head())
    
    # Remove duplicates:
    df = df.drop_duplicates(subset=[timestampCol, 'measure_name'], keep='last')
    
    # Create a tabular view of the dataset if possible:
    df = df.pivot(columns='measure_name', index=timestampCol, values='measure_value')
    print(df.head())
    print(df.tail())

    print("================================")
    
    # Writing the new file
    local_fname = f'/tmp/sensors.csv'
    df.index.name = 'timestamp'
    df.to_csv(local_fname)
    
    print(df.shape)
    
    target_bucket = s3.Bucket(bucket)
    target_bucket.upload_file(
        local_fname, 
        prefix,
        { 'Tagging': f"L4EDemoAppUser={uid}&AssetDescription={assetDescription}" }
    )
    
    # Deleting the temporary file unloaded from Timestream:
    deleteParquetDataset(bucket, event['detail']['unloadObject']['key'])

    return {
        'uid': uid,
        'assetDescription': assetDescription,
        'datasetPreparationSfnArn': event['datasetPreparationSfnArn'],
        'detail': {
            'bucket': { 'name': bucket },
            'object': { 'key': prefix }
        }
    }
    
def waitForManifest(bucket, prefix):
    manifest_found = False
    
    print('---------------------------')
    while not manifest_found:
        response = s3_client.list_objects_v2(Bucket=bucket, Prefix=prefix)
        print(response)
        
        if 'Contents' in response.keys():
            manifest_file = filter(lambda file: file['Key'].endswith('manifest.json'), response['Contents'])
            manifest_file = list(manifest_file)
            print(manifest_file)
            print(len(manifest_file))
            
            if len(list(manifest_file)) > 0:
                manifest_found = True
            
        if not manifest_found:
            print('Timestream unload still in progress...')
            time.sleep(5)
            
    print('---------------------------')
    
# This function deletes all the files from the parquet
# dataset that starts in the s3_root root on S3:
def deleteParquetDataset(bucket, s3_root):
    response = s3_client.list_objects_v2(Bucket=bucket, Prefix=s3_root)
    object_list = []
    
    for object in response['Contents']:
        object_list.append({'Key': object['Key']})
        
    s3_client.delete_objects(
        Bucket=bucket,
        Delete={
            'Objects': object_list
        }
    )