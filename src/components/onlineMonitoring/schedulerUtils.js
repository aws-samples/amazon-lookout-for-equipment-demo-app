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

// // ---------------------------------------
// // Build a data structure that can be 
// // directly fed to the LineChart component
// // ---------------------------------------
// function buildSensorContributionSeries(items) {
//     const tagsList = cleanList(['model', 'timestamp'], Object.keys(items[0]))
//     let data = {}

//     items.forEach((item) => {
//         tagsList.forEach((tag) => {
//             if (!data[tag]) { data[tag] = [] }
//             data[tag].push({
//                 x: new Date(parseInt(item['timestamp']['N'])*1000),
//                 y: parseFloat(item[tag]['N'])
//             })
//         })
//     })

//     return data
// }

// ---------------------------------------------------
// This function gets the raw anomaly scores generated
// by a given model between a range of time
// ---------------------------------------------------
async function getSensorContribution(gateway, asset, table, startTime, endTime) {
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

        return sensorContribution.Items
    }
    
    return undefined
}

// ---------------------------------------
// Build a data structure that can be 
// directly fed to the LineChart component
// ---------------------------------------
function buildSensorContributionSeries(x, y, tagsList) {
    let data = {}

    x.forEach((xItem, index) => {
        tagsList.forEach((tag) => {
            if (!data[tag]) { data[tag] = [] }
            data[tag].push({
                x: xItem,
                y: y[index][tag]
            })
        })
    })

    return data
}

function buildTimeSeries(items, tagsList) {
    let data = {}

    items.forEach((item) => {
        let currentItem = {}

        tagsList.forEach((tag) => {
            currentItem[tag] = parseFloat(item[tag]['N'])
        })
        
        data[new Date(item['timestamp']['N']*1000)] = currentItem
    })

    return data
}

// -------------------------------------------
// Builds an empty record given a list of tags
// -------------------------------------------
function getEmptyRecord(tagsList) {
    let emptyRecord = {}

    tagsList.forEach((tag) => {
        emptyRecord[tag] = 0.0
    })

    return emptyRecord
}

export async function getSensorData(gateway, asset, projectName, modelName, startTime, endTime) {
    const possibleSamplingRate = {
        'PT1S': 1, 
        'PT5S': 5,
        'PT10S': 10,
        'PT15S': 15,
        'PT30S': 30,
        'PT1M': 60,
        'PT5M': 300,
        'PT10M': 600,
        'PT15M': 900,
        'PT30M': 1800,
        'PT1H': 3600
    }

    const contributionData = await getSensorContribution(gateway, asset, `l4edemoapp-${projectName}-sensor_contribution`, startTime, endTime)
    const response = await gateway.lookoutEquipment.describeModel(modelName)
    const samplingRate = possibleSamplingRate[response['DataPreProcessingConfiguration']['TargetSamplingRate']]
    const tagsList = cleanList(['model', 'timestamp'], Object.keys(contributionData[0]))
    const ts = buildTimeSeries(contributionData, tagsList)
    const emptyRow = getEmptyRecord(tagsList)
    const xStart = new Date(Object.keys(ts)[0])
    const xEnd = new Date(Object.keys(ts)[Object.keys(ts).length - 1])
    const numIndexes = parseInt((xEnd - xStart)/1000 / samplingRate)

    const xDomain = Array.from(new Array(numIndexes), (x, index) => new Date(xStart.getTime() + index * samplingRate * 1000))
    const yData = Array.from(xDomain, x => {
        if (ts[x]) {
            return ts[x]
        }
        return emptyRow
    })

    return buildSensorContributionSeries(xDomain, yData, tagsList)
}