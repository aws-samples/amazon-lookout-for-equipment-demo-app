// Imports:
import { Storage } from 'aws-amplify'
import { cleanList } from '../../utils/utils'

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

// ---------------------------------------
// Build a data structure that can be 
// directly fed to the LineChart component
// ---------------------------------------
function buildAnomalyScoreSeries(items) {
    let data = []

    items.forEach((item) => {
        data.push({
            x: new Date(parseInt(item['timestamp']['N'])*1000),
            y: parseFloat(item['anomaly_score']['N'])
        })
    })

    return data
}

// ---------------------------------------------------
// This function gets the raw anomaly scores generated
// by a given model between a range of time
// ---------------------------------------------------
export async function getAnomalyScores(gateway, asset, startTime, endTime) {
    const anomalyScoreQuery = { 
        TableName: 'l4edemoapp-raw-anomalies',
        KeyConditionExpression: "#model = :model AND #timestamp BETWEEN :startTime AND :endTime",
        ExpressionAttributeNames: {
            "#model": "model",
            "#timestamp": "timestamp"
        },
        ExpressionAttributeValues: {
             ":model": {"S": asset},
             ":startTime": {"N": startTime.toString() },
             ":endTime": {"N": endTime.toString() }
        }
    }

    let anomalyScores = await gateway
        .dynamoDbQuery(anomalyScoreQuery)
        .catch((error) => console.log(error.response))

    // If the payload is too large (> 1 MB), the API will paginate
    // the output. Let's collect all the data we need to cover the 
    // range requested by the user:
    if (anomalyScores.Items.length > 0) {
        let currentAnomalyScores = undefined
        if (anomalyScores.LastEvaluatedKey) {
            let lastEvaluatedKey = anomalyScores.LastEvaluatedKey

            do {
                currentAnomalyScores = await gateway
                    .dynamoDbQuery({...anomalyScoreQuery, ExclusiveStartKey: lastEvaluatedKey})
                    .catch((error) => console.log(error.response))

                if (currentAnomalyScores.LastEvaluatedKey) {
                    lastEvaluatedKey = currentAnomalyScores.LastEvaluatedKey
                }
                anomalyScores.Items = [...anomalyScores.Items, ...currentAnomalyScores.Items]

            } while (currentAnomalyScores.LastEvaluatedKey)
        }

        return buildAnomalyScoreSeries(anomalyScores.Items)
    }
    
    return undefined
}

// ------------------------------------------------
// This function gets the anomalous events detected
// by a given model between a range of time
// ------------------------------------------------
export async function getAnomalies(gateway, asset, startTime, endTime) {
    const anomaliesQuery = { 
        TableName: 'l4edemoapp-anomalies',
        KeyConditionExpression: "#model = :model AND #timestamp BETWEEN :startTime AND :endTime",
        ExpressionAttributeNames: {
            "#model": "model",
            "#timestamp": "timestamp"
        },
        ExpressionAttributeValues: {
             ":model": {"S": asset},
             ":startTime": {"N": startTime.toString() },
             ":endTime": {"N": endTime.toString() }
        }
    }

    let anomalies = await gateway
        .dynamoDbQuery(anomaliesQuery)
        .catch((error) => console.log(error.response))

    if (anomalies.Items.length > 0) {
        let currentAnomalies = undefined
        if (anomalies.LastEvaluatedKey) {
            let lastEvaluatedKey = anomalies.LastEvaluatedKey

            do {
                currentAnomalies = await gateway
                    .dynamoDbQuery({...anomaliesQuery, ExclusiveStartKey: lastEvaluatedKey})
                    .catch((error) => console.log(error.response))

                if (currentAnomalies.LastEvaluatedKey) {
                    lastEvaluatedKey = currentAnomalies.LastEvaluatedKey
                }
                anomalies.Items = [...anomalies.Items, ...currentAnomalies.Items]

            } while (currentAnomalies.LastEvaluatedKey)
        }

        let condition = { '0': 0.0, '1': 0.0 }
        let totalTime = 0.0
        anomalies.Items.forEach((item, index) => {
            if (index > 0) {
                const previousTimestamp = parseFloat(anomalies.Items[index - 1]['timestamp']['N'])
                const currentTimestamp = parseFloat(item['timestamp']['N'])
                const duration = currentTimestamp - previousTimestamp

                condition[item['anomaly']['N']] += duration
                totalTime += duration
            }
            
        })

        return {totalTime, condition}
    }

    return undefined
}

// ---------------------------------------
// Build a data structure that can be 
// directly fed to the LineChart component
// ---------------------------------------
function buildSensorContributionSeries(items) {
    const tagsList = cleanList(['model', 'timestamp'], Object.keys(items[0]))
    let data = {}

    items.forEach((item) => {
        tagsList.forEach((tag) => {
            if (!data[tag]) { data[tag] = [] }
            data[tag].push({
                x: new Date(parseInt(item['timestamp']['N'])*1000),
                y: parseFloat(item[tag]['N'])
            })
        })
    })

    return data
}

// ---------------------------------------------------
// This function gets the raw anomaly scores generated
// by a given model between a range of time
// ---------------------------------------------------
export async function getSensorContribution(gateway, asset, table, startTime, endTime) {
    const anomalyScoreQuery = { 
        TableName: table,
        KeyConditionExpression: "#model = :model AND #timestamp BETWEEN :startTime AND :endTime",
        ExpressionAttributeNames: {
            "#model": "model",
            "#timestamp": "timestamp"
        },
        ExpressionAttributeValues: {
             ":model": {"S": asset},
             ":startTime": {"N": startTime.toString() },
             ":endTime": {"N": endTime.toString() }
        }
    }

    let sensorContribution = await gateway
        .dynamoDbQuery(anomalyScoreQuery)
        .catch((error) => console.log(error.response))

    // If the payload is too large (> 1 MB), the API will paginate
    // the output. Let's collect all the data we need to cover the 
    // range requested by the user:
    if (sensorContribution.Items.length > 0) {
        let currentSensorContribution = undefined
        if (sensorContribution.LastEvaluatedKey) {
            let lastEvaluatedKey = sensorContribution.LastEvaluatedKey

            do {
                currentSensorContribution = await gateway
                    .dynamoDbQuery({...anomalyScoreQuery, ExclusiveStartKey: lastEvaluatedKey})
                    .catch((error) => console.log(error.response))

                if (currentSensorContribution.LastEvaluatedKey) {
                    lastEvaluatedKey = currentSensorContribution.LastEvaluatedKey
                }
                sensorContribution.Items = [...sensorContribution.Items, ...currentSensorContribution.Items]

            } while (currentSensorContribution.LastEvaluatedKey)
        }

        return buildSensorContributionSeries(sensorContribution.Items)
    }
    
    return undefined
}