// Imports
import axios from 'axios'

// ----------------------------------------------------
// Extract the lists of buckets visible in this account
// ----------------------------------------------------
export async function getListBuckets() {
    let response = await axios.post(
        `https://${window.apiGatewayId}.execute-api.${window.region}.amazonaws.com/default/list-buckets`
    )
    response = JSON.parse(response.data.body)

    const listBuckets = []
    response.forEach((bucket) => {
        listBuckets.push({
            Name: bucket.Name,
            CreationDate: new Date(bucket.CreationDate * 1000).toUTCString(),
            Region: "US East (N. Virginia) us-east-1"
        })
    })

    return listBuckets
}

// -----------------------------------------------------------------------
// From a bucket and a given prefix, extract all objects under this prefix
// -----------------------------------------------------------------------
export async function getListObjects(bucketName, pathPrefix) {
    let response = await axios.post(
        `https://${window.apiGatewayId}.execute-api.${window.region}.amazonaws.com/default/list-objects`, {
            'bucketName': bucketName,
            'pathPrefix': pathPrefix
        }
    )
    response = JSON.parse(response.data.body)

    let listObjects = []
    for (const folder of response.folders) {
        listObjects.push({
            Key: folder.Folder.slice(pathPrefix.length),
            IsFolder: true
        })
    }
    for (const object of response.files) {
        listObjects.push({
            Key: object.Key.slice(pathPrefix.length),
            LastModified: new Date(object.LastModified * 1000).toUTCString(),
            Size: object.Size
        })
    }

    return listObjects
}

// -----------------------------------------------------------------------------
// Copy a CSV file from a source location managed by the user and bring it under
// the bucket managed by this application.
// -----------------------------------------------------------------------------
export async function copyCsvFromS3(
    sourceBucket, 
    sourcePrefix, 
    targetBucket, 
    targetPrefix, 
    createRole, 
    roleArn, 
    uid, 
    assetDescription
) {

    let sfnInput = {
        sourceBucket: sourceBucket,
        sourcePrefix: sourcePrefix,
        targetBucket: targetBucket,
        targetPrefix: targetPrefix,
        createRole: createRole,
        existingRole: roleArn,
        uid: uid,
        assetDescription: assetDescription,
        datasetPreparationSfnArn: window.datasetPreparationArn
    }

    let response = await axios.post(
        `https://${window.apiGatewayId}.execute-api.${window.region}.amazonaws.com/default/create-project/csv-from-s3`, {
            'input': JSON.stringify(sfnInput),
            'stateMachineArn': window.csvFromS3Arn
        }
    )

    return response.data
}


// ----------------------------------------------------
// Delete object in a S3 bucket
// if the key object contains / it will be transformed
// with the proper encoding
// ----------------------------------------------------
export async function deleteBucketObject(key) {

    let response = await axios.delete(
       `https://${window.apiGatewayId}.execute-api.${window.region}.amazonaws.com/default/delete-object/${key.split('/').map(encodeURIComponent).join('%2F')}`
    )

    return response.data
}