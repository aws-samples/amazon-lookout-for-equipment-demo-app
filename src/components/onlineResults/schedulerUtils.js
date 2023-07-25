// Imports:
import { Storage } from 'aws-amplify'

// ------------------------------------------------
// Get the S3 key of the dataset initially ingested 
// into the Lookout for Equipment project:
// ------------------------------------------------
async function getDatasetS3Key(gateway, projectName) {
    let datasetResponse = undefined
    let datasetCsvS3Key = ""

    await gateway.lookoutEquipmentDescribeDataset('l4e-demo-app-' + projectName)
        .then((x) => datasetResponse = x)
        .catch((error) => { console.log(error.response)})
    
    const bucket = datasetResponse['IngestionInputConfiguration']['S3InputConfiguration']['Bucket']
    let prefix = datasetResponse['IngestionInputConfiguration']['S3InputConfiguration']['Prefix'] + projectName + '/'
    prefix = prefix.substring('public'.length + 1)

    await Storage.list(prefix)
        .then(({ results }) => datasetCsvS3Key = results[0]['key'])
        .catch((error) => console.log(error.response));

    return datasetCsvS3Key
}

export async function generateReplayData(modelName, projectName, gateway, s3ProgressCallback) {
    const datasetCsvS3Key = await getDatasetS3Key(gateway, projectName)

    console.log(datasetCsvS3Key)

    const result = await Storage.get(
        datasetCsvS3Key, 
        { 
            download: true,
            progressCallback(progress) {
                s3ProgressCallback(progress)
                // console.log(`Downloaded: ${progress.loaded}/${progress.total}`);
            }
        }
    )

    // data.Body is a Blob
    result.Body.text().then((string) => {
        console.log(string.substr(0, 100))
    })
}