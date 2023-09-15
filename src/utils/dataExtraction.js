// ----------------------------------------------------------
// Extract a summary of the signals contained in this dataset
// ----------------------------------------------------------
export async function getSignalDetails(gateway, modelName) {
    const lookoutEquipmentProjectName = 'l4e-demo-app-' + modelName

    const response = await gateway.lookoutEquipment
        .listDatasets(lookoutEquipmentProjectName)
        .catch((error) => console.log(error.response))

    if (response['DatasetSummaries'].length > 0) {
        const projectDetail = await gateway
            .lookoutEquipmentDescribeDataset(lookoutEquipmentProjectName)
            .catch((error) => { console.log(error.response['data']['Message']) })

        if (projectDetail) {
            const ingestionStatus = projectDetail['Status']
            if (ingestionStatus !== 'ACTIVE') {
                return undefined
            }
            else {
                const ingestionJobDetails = await gateway.lookoutEquipmentListDataIngestionJobs(lookoutEquipmentProjectName)
                const jobId = ingestionJobDetails["DataIngestionJobSummaries"][0]["JobId"]
                const sensorStatistics = await gateway.lookoutEquipmentListSensorStatistics(lookoutEquipmentProjectName, jobId)

                return {
                    tagsList: JSON.parse(projectDetail.Schema)['Components'][0]['Columns'],
                    numTags: JSON.parse(projectDetail.Schema)['Components'][0]['Columns'].length - 1,
                    sensorStatistics: sensorStatistics["SensorStatisticsSummaries"]
                }
            }
        }
    }

    return undefined
}

// -----------------------------------------------------------
// Get details about a single time series from a given dataset
// -----------------------------------------------------------
export async function getSingleTimeSeries(gateway, modelName, sensorName) {
    const targetTableName = 'l4edemoapp-' + modelName
    let current_timeseries = undefined
    const timeSeriesQuery = { 
        TableName: targetTableName,
        KeyConditionExpression: "#sr = :sr",
        ExpressionAttributeNames: {
            "#sr": "sampling_rate", 
            "#sensor": sensorName,
            "#asset": "asset",
            "#timestamp": "timestamp",
            "#unix": "unix_timestamp"
        },
        ExpressionAttributeValues: { ":sr": {"S": "1h"}},
        Select: "SPECIFIC_ATTRIBUTES",
        ProjectionExpression: "#asset, #sr, #timestamp, #unix, #sensor"
    }

    let timeseries = await gateway.dynamoDbQuery(timeSeriesQuery)
    if (timeseries.LastEvaluatedKey) {
        let lastEvaluatedKey = timeseries.LastEvaluatedKey

        do {
            current_timeseries = await gateway
                .dynamoDbQuery({...timeSeriesQuery, ExclusiveStartKey: lastEvaluatedKey})

            if (current_timeseries.LastEvaluatedKey) {
                lastEvaluatedKey = current_timeseries.LastEvaluatedKey
            }
            timeseries.Items = [...timeseries.Items, ...current_timeseries.Items]

        } while (current_timeseries.LastEvaluatedKey)
    }

    return {
        timeseries: timeseries,
        startDate: timeseries.Items[0]['timestamp']['S'],
        endDate: timeseries.Items[timeseries.Items.length - 1]['timestamp']['S'],
        tagsList: Object.keys(timeseries.Items[0]),
    }
}

// ---------------------------------------------
// Extract all the sensor data for a given model
// ---------------------------------------------
export async function getAllTimeseries(gateway, modelName) {
    const targetTableName = 'l4edemoapp-' + modelName

    const listTables = await gateway.dynamoDbListTables()
    const tableAvailable = (listTables['TableNames'].indexOf(targetTableName) >= 0)

    if (tableAvailable) {
        let tableStatus = await gateway.dynamoDbDescribeTable(targetTableName)
        tableStatus = tableStatus['Table']['TableStatus']

        if (tableStatus === 'ACTIVE') {
            const timeSeriesQuery = { 
                TableName: targetTableName,
                KeyConditionExpression: "#sr = :sr",
                ExpressionAttributeNames: {"#sr": "sampling_rate"},
                ExpressionAttributeValues: { ":sr": {"S": "1h"}}
            }

            let timeseries = await gateway.dynamoDbQuery(timeSeriesQuery)
            let current_timeseries = undefined
            if (timeseries.LastEvaluatedKey) {
                let lastEvaluatedKey = timeseries.LastEvaluatedKey

                do {
                    current_timeseries = await gateway
                        .dynamoDbQuery({...timeSeriesQuery, ExclusiveStartKey: lastEvaluatedKey})

                    if (current_timeseries.LastEvaluatedKey) {
                        lastEvaluatedKey = current_timeseries.LastEvaluatedKey
                    }
                    timeseries.Items = [...timeseries.Items, ...current_timeseries.Items]

                } while (current_timeseries.LastEvaluatedKey)
            }

            return {
                timeseries: timeseries,
                startDate: timeseries.Items[0]['timestamp']['S'],
                endDate: timeseries.Items[timeseries.Items.length - 1]['timestamp']['S'],
                tagsList: Object.keys(timeseries.Items[0]),
            }
        }
    }

    return {
        timeseries: undefined,
        startDate: undefined,
        endDate: undefined,
        tagsList: undefined
    }
}

// -------------------------------------------
// Extract all the sensor data for a given 
// model but within a certain time window only
// -------------------------------------------
export async function getAllTimeseriesWindow(gateway, modelName, startTime, endTime, samplingRate) {
    // Training data are stored at a 1 hour sampling rate whereas
    // live inference data are stored raw (e.g. 5 minutes):
    let currentSamplingRate = ""
    if (!samplingRate) {
        currentSamplingRate = "1h"
    }
    else {
        currentSamplingRate = samplingRate
    }

    const targetTableName = 'l4edemoapp-' + modelName
    const timeSeriesQuery = { 
        TableName: targetTableName,
        KeyConditionExpression: "#sr = :sr AND #timestamp BETWEEN :startTime AND :endTime",
        ExpressionAttributeNames: {"#sr": "sampling_rate", "#timestamp": "unix_timestamp"},
        ExpressionAttributeValues: { 
            ":sr": {"S": currentSamplingRate}, 
            ":startTime": {"N": startTime.toString()},
            ":endTime": {"N": endTime.toString()}
        }
    }

    let timeseries = await gateway.dynamoDbQuery(timeSeriesQuery)
                            .catch((error) => { console.log(error.response)})
    let current_timeseries = undefined
    if (timeseries.LastEvaluatedKey) {
        let lastEvaluatedKey = timeseries.LastEvaluatedKey

        do {
            current_timeseries = await gateway
                .dynamoDbQuery({...timeSeriesQuery, ExclusiveStartKey: lastEvaluatedKey})

            if (current_timeseries.LastEvaluatedKey) {
                lastEvaluatedKey = current_timeseries.LastEvaluatedKey
            }
            timeseries.Items = [...timeseries.Items, ...current_timeseries.Items]

        } while (current_timeseries.LastEvaluatedKey)
    }

    return {
        timeseries: timeseries,
        startDate: timeseries.Items[0]['timestamp']['S'],
        endDate: timeseries.Items[timeseries.Items.length - 1]['timestamp']['S'],
        tagsList: Object.keys(timeseries.Items[0]),
    }
}

// -----------------------------
// Get trained model information
// -----------------------------
export async function getModelDetails(gateway, modelName, projectName, uid) {
    const modelResponse = await gateway.lookoutEquipment.describeModel(modelName)

    let offCondition = processOffResponse(modelResponse)
    if (offCondition) { offCondition['component'] = projectName }
    let {labelGroupName, labels} = await processLabels(gateway, modelResponse)
    labelGroupName = labelGroupName.slice(projectName.length + 1 + uid.length + 1)

    const possibleSamplingRate = {
        'PT1S': '1 second', 
        'PT5S': '5 seconds',
        'PT10S': '10 seconds',
        'PT15S': '15 seconds',
        'PT30S': '30 seconds',
        'PT1M': '1 minute',
        'PT5M': '5 minutes',
        'PT10M': '10 minutes',
        'PT15M': '15 minutes',
        'PT30M': '30 minutes',
        'PT1H': '1 hour'
    }

    // Computes a human-readable training time:
    let trainingTime = modelResponse['TrainingExecutionEndTime'] - modelResponse['TrainingExecutionStartTime']
    if (trainingTime / 3600 > 1.0) {
        trainingTime = Math.floor(trainingTime / 3600) + ' hour'
        if (Math.floor(trainingTime / 3660) > 1) {
            trainingTime = trainingTime + 's'
        }    }
    else if (trainingTime / 60 > 1.0) {
        trainingTime = Math.floor(trainingTime / 60) + ' minute'
        if (Math.floor(trainingTime / 60) > 1) {
            trainingTime = trainingTime + 's'
        }
    }
    else {
        trainingTime = Math.floor(trainingTime) + ' second'
        if (Math.floor(trainingTime) > 1) {
            trainingTime = trainingTime + 's'
        }    
    }

    const samplingRate = possibleSamplingRate[modelResponse['DataPreProcessingConfiguration']['TargetSamplingRate']]

    let response = {
        status: modelResponse['Status'],
        trainingTime: trainingTime,
        createdAt: new Date(modelResponse['CreatedAt']*1000).toISOString().replace('T', ' ').substring(0,19),
        trainingStart: new Date(modelResponse['TrainingDataStartTime']*1000).toISOString().replace('T', ' ').substring(0,19),
        trainingEnd: new Date(modelResponse['TrainingDataEndTime']*1000).toISOString().replace('T', ' ').substring(0,19),
        evaluationStart: new Date(modelResponse['EvaluationDataStartTime']*1000).toISOString().replace('T', ' ').substring(0,19),
        evaluationEnd: new Date(modelResponse['EvaluationDataEndTime']*1000).toISOString().replace('T', ' ').substring(0,19),
        samplingRate: samplingRate,
        offCondition: offCondition,
        labelGroupName: labelGroupName,
        labels: labels
    }

    if (modelResponse['Status'] === 'SUCCESS') {
        const modelEvaluationInfos = await getModelEvaluationInfos(gateway, modelName, projectName, modelResponse['EvaluationDataEndTime'], uid)
        const timeseries = await getAllTimeseriesWindow(
            gateway, 
            uid + '-' + projectName, 
            modelResponse['TrainingDataStartTime'],
            modelResponse['EvaluationDataEndTime']
        )

        response['modelMetrics'] = JSON.parse(modelResponse['ModelMetrics']),
        response['anomalies'] = modelEvaluationInfos['anomalies'],
        response['dailyAggregation'] = modelEvaluationInfos['dailyAggregation'],
        response['sensorContribution'] = modelEvaluationInfos['sensorContribution'],
        response['tagsList'] = getTagsListFromModel(modelResponse),
        response['timeseries'] = timeseries.timeseries
        response['events'] = modelEvaluationInfos['events']
    }

    if (modelResponse['Status'] === 'FAILED') {
        response['failedReason'] = modelResponse['FailedReason']
    }

    return response
}

function processOffResponse(modelResponse) {
    let offCondition = undefined

    if (modelResponse['OffCondition']) {
        offCondition = modelResponse['OffCondition'].split('\\')[1]
        if (offCondition.indexOf('<') >= 0) {
            offCondition = offCondition.split('<')

            offCondition = {
                signal: offCondition[0],
                criteria: '<',
                conditionValue: parseFloat(offCondition[1])
            }
        }
        else {
            offCondition = offCondition.split('>')

            offCondition = {
                signal: offCondition[0],
                criteria: '>',
                conditionValue: parseFloat(offCondition[1])
            }
        }
    }
    
    return offCondition
}

async function processLabels(gateway, modelResponse) {
    let labels = undefined
    let labelGroupName = ""

    if (modelResponse['LabelsInputConfiguration']) {
        labelGroupName = modelResponse['LabelsInputConfiguration']['LabelGroupName']

        const response = await gateway.lookoutEquipment.listLabels(labelGroupName)
        
        if (response['LabelSummaries'].length > 0) {
            labels = []
            response['LabelSummaries'].forEach((label) => {
                labels.push({
                    start: new Date(label['StartTime'] * 1000),
                    end: new Date(label['EndTime'] * 1000)
                })
            })
        }
    }

    return {labelGroupName, labels}
}

// -------------------------------------------------------------
// Extracts the tags list from the schema defined for this model
// -------------------------------------------------------------
export function getTagsListFromModel(modelResponse) {
    const schema = JSON.parse(modelResponse['Schema'])
    const tags = schema['Components'][0]['Columns']

    let tagsList = []
    tags.forEach((tag) => {
        tagsList.push(tag['Name'])
    })

    return tagsList
}

// ----------------------------
// Get model evaluation details
// ----------------------------
async function getModelEvaluationInfos(gateway, modelName, assetName, endTime, uid) {
    // const currentModelName = assetName + '|' + modelName
    const anomalies = await getAnomalies(gateway, modelName, endTime, assetName, uid)
    const dailyAggregation = await getDailyAggregation(gateway, modelName, endTime, assetName, uid)
    const sensorContribution = await getSensorContribution(gateway, modelName, assetName, endTime, uid)
    const events = await getEvents(gateway, modelName)

    let tagsList = undefined
    if (sensorContribution && sensorContribution.Items.length > 0) {
        tagsList = Object.keys(sensorContribution.Items[0]) 
    }

    return {
        anomalies: anomalies,
        events: events,
        dailyAggregation: dailyAggregation,
        sensorContribution: sensorContribution,
        tagsList: tagsList
    }
}

async function getEvents(gateway, modelName) {
    let response = await gateway.lookoutEquipment.describeModel(modelName)
    response = JSON.parse(response['ModelMetrics'])['predicted_ranges']
    let events = []

    response.forEach((event) => {
        events.push({
            start: new Date(event['start']),
            end: new Date(event['end'])
        })
    })

    return events
}

// -----------------------------------------------------------
// Get all the anomalies in the database for the current model
// -----------------------------------------------------------
async function getAnomalies(gateway, model, endTime, projectName, uid) {
    const anomaliesQuery = { 
        TableName: `l4edemoapp-${uid}-${projectName}-anomalies`,
        KeyConditionExpression: "#model = :model AND #timestamp <= :endTime",
        ExpressionAttributeNames: { "#model": "model", "#timestamp": "timestamp"},
        ExpressionAttributeValues: { 
            ":model": {"S": model},
            ":endTime": {"N": endTime.toString()}
        }
    }

    let anomalies = await gateway
        .dynamoDbQuery(anomaliesQuery)
        .catch((error) => console.log(error.response))

    let currentAnomaliesBatch = undefined
    if (anomalies.LastEvaluatedKey) {
        let lastEvaluatedKey = anomalies.LastEvaluatedKey

        do {
            currentAnomaliesBatch = await gateway
                .dynamoDbQuery({...anomaliesQuery, ExclusiveStartKey: lastEvaluatedKey})
                .catch((error) => console.log(error.response))

            if (currentAnomaliesBatch.LastEvaluatedKey) {
                lastEvaluatedKey = currentAnomaliesBatch.LastEvaluatedKey
            }
            anomalies.Items = [...anomalies.Items, ...currentAnomaliesBatch.Items]

        } while (currentAnomaliesBatch.LastEvaluatedKey)
    }

    return anomalies
}

// ---------------------------------------------
// Anomalies daily aggregation for a given model
// ---------------------------------------------
async function getDailyAggregation(gateway, model, endTime, projectName, uid) {
    const dailyAggregation = await gateway.dynamoDbQuery({ 
        TableName: `l4edemoapp-${uid}-${projectName}-daily_rate`,
        KeyConditionExpression: "#model = :model AND #timestamp <= :endTime",
        ExpressionAttributeNames: { "#model": "model", "#timestamp": "timestamp"},
        ExpressionAttributeValues: { 
            ":model": {"S": model},
            ":endTime": {"N": endTime.toString()}
        }
    })
    .catch((error) => console.log(error.response))

    return dailyAggregation
}

// ------------------------------------------------------
// Sensor contribution for the event found for this model
// ------------------------------------------------------
async function getSensorContribution(gateway, model, assetName, endTime, uid) {
    const sensorContributionTableName = `l4edemoapp-${uid}-${assetName}-sensor_contribution`
    const { TableNames: listTables } = await gateway.dynamoDbListTables()

    let sensorContribution = undefined
    if (listTables.indexOf(sensorContributionTableName) >= 0) {
        const sensorContributionQuery = { 
            TableName: sensorContributionTableName,
            KeyConditionExpression: "#model = :model AND #timestamp <= :endTime",
            ExpressionAttributeNames: { "#model": "model", "#timestamp": "timestamp"},
            ExpressionAttributeValues: { 
                ":model": {"S": model},
                ":endTime": {"N": endTime.toString()}
            }
        }

        sensorContribution = await gateway.dynamoDb.queryAll(sensorContributionQuery)
                            .catch((error) => console.log(error.response))
    }

    return sensorContribution
}

// ----------------------------------------
// Get the scheduler info for a given model
// ----------------------------------------
export async function getSchedulerInfo(gateway, modelName) {
    let response = await gateway.lookoutEquipment.listInferenceSchedulers(modelName)
    response = response['InferenceSchedulerSummaries']

    if (response.length > 0) {
        response = response[0]
        response = await gateway.lookoutEquipment.describeInferenceScheduler(response['InferenceSchedulerName'])

        return response
    }
    
    return undefined
}