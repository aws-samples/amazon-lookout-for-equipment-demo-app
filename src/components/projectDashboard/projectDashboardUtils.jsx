import { getModelsSummary} from '../modelDeployment/deploymentUtils'
import { getAllProjects, getAllExecutionId } from '../../utils/utils'

// ------------------------------------------------------------
// Get details about the project to build the dashboard summary
// ------------------------------------------------------------
export const getProjectDetails = async (gateway, uid, projectName) => {
    const listProjects = await getAllProjects(gateway, uid)
    const targetTableName = `l4edemoapp-${uid}-${projectName}`
    const listTables = await gateway.dynamoDb
                                    .listTables()
                                    .catch((error) => console.log(error.response))
    const tableAvailable = (listTables['TableNames'].indexOf(targetTableName) >= 0)
    const executionIds = await getAllExecutionId(gateway, uid)
    
    let errorMessage = ""
    let errorDetails = undefined
    if (listProjects.indexOf(uid + '-' + projectName)) {
        if (tableAvailable) {
            let tableStatus = await gateway.dynamoDb
                                           .describeTable(targetTableName)
                                           .catch((error) => console.log(error.response))
            tableStatus = tableStatus['Table']['TableStatus']

            if (tableStatus === 'ACTIVE') {
                let fetchError = false

                const contentHead = await gateway
                    .dynamoDb.query({ 
                        TableName: targetTableName,
                        KeyConditionExpression: "sampling_rate = :sr",
                        ExpressionAttributeValues: { ":sr": {"S": "1h"} },
                        Limit: 5
                    })
                    .catch(() => { fetchError = true })

                const contentTail = await gateway
                    .dynamoDb.query(
                        { 
                            TableName: targetTableName,
                            KeyConditionExpression: "sampling_rate = :sr",
                            ExpressionAttributeValues: { ":sr": {"S": "1h"} },
                            Limit: 5,
                            ScanIndexForward: false
                        }
                    )
                    .catch(() => { fetchError = true })

                const { rowCounts, assetDescription } = await getProjectInfos(gateway, uid, projectName)

                if (!fetchError) {
                    return {
                        projectDetails: {
                            contentHead: contentHead,
                            contentTail: contentTail,
                            rowCounts: rowCounts,
                            assetDescription: assetDescription,
                            startDate: contentHead.Items[0]['timestamp']['S'],
                            endDate: contentTail.Items[contentTail.Items.length - 1]['timestamp']['S'],
                            firstRow: contentHead.Items[0],
                            attributeList: Object.keys(contentHead.Items[0]),
                            numSensors: Object.keys(contentHead.Items[0]).length
                        },
                        errorMessage: ""
                    }
                }
            }
        }

        // The dynamoDB Table is not available, but the project is listed: this 
        // either means that the initial ingestion is not finished yet or the
        // file provided was not valid (and ingestion did not even start)
        else {
            // Let's check if the ingestion pipeline is successful
            const executionArn = executionIds[projectName]
            const response = await gateway.stepFunctions.describeExecution(executionArn)

            if (response['status'] === 'FAILED') {
                errorMessage = 'Dataset ingestion failed. Check your file, delete this project and try again.'
                errorDetails = JSON.parse(response['cause'])['errorMessage']
            }
        }
    }

    // Now that we have rule out all the other cases, we can say 
    // that this project does not exist or that it's not accessible 
    // for this user:
    else {
        errorMessage = "Project not found"
    }

    return {
        projectDetails: undefined,
        errorMessage: errorMessage,
        errorDetails: errorDetails
    }
}

// --------------------------------------
// Get the rows number of a given project
// --------------------------------------
async function getProjectInfos(gateway, uid, projectName) {
    const projectQuery = { 
        TableName: `l4edemoapp-projects-${window.stackId}`,
        KeyConditionExpression: "#user = :user AND #project = :project",
        ExpressionAttributeNames: {"#user": "user_id", "#project": "project"},
        ExpressionAttributeValues: { 
            ":user": {"S": uid},
            ":project": {"S": projectName}
        }
    }

    const response = await gateway.dynamoDb.queryAll(projectQuery).catch((error) => console.log(error.response))

    return {
        rowCounts: response.Items[0]['numRows']['N'],
        assetDescription: response.Items[0]['assetDescription'] ? response.Items[0]['assetDescription']['S'] : "n/a"
    }
    
    
}

// --------------------------------------------------------------
// Collects the models and schedulers attached to a given project
// --------------------------------------------------------------
export async function getProjectData(gateway, projectName) {
    let listModels = []
    let listSchedulers = []
    const models = await getModelsSummary(gateway, projectName)

    if (models && models.length > 0) {
        models.forEach((model) => {
            if (model['Status'] !== 'SUCCESS') {
                listModels.push(model['ModelName'] + ` (${model['Status']})`)
            }
            else {
                listModels.push(model['ModelName'])
            }

            if (model['Scheduler']) {
                listSchedulers.push({
                    model: model['ModelName'],
                    status: model['Scheduler']['Status']
                })
            }
        })
    }

    return {
        listModels, 
        listSchedulers
    }
}

export function getSamplingRate(rowCounts, startDate, endDate) {
    const numRows = parseFloat(rowCounts)
    const start = new Date(startDate).getTime() / 1000
    const end = new Date(endDate).getTime() / 1000
    const samplingRate = ((end - start)/numRows).toFixed(1)

    return samplingRate
}

// --------------------------------------
// Compute the sampling rate and build a
// human-readable version with the units:
// --------------------------------------
export const SamplingRate = ({ rowCounts, startDate, endDate }) => {
    if (rowCounts) {
        const samplingRate = getSamplingRate(rowCounts, startDate, endDate)
        return ( <div>{samplingRate} seconds</div> )
    }
    else {
        return ( <div>n/a</div> )
    }
}

// --------------------------------------------
// Computes the closest sampling rate that 
// matches the ones calculated from the dataset
// --------------------------------------------
export function getClosestSamplingRate(samplingRate) {
    const samplingRateList = [1, 5, 10, 15, 30, 60, 300, 600, 900, 1800, 3600]
    let calculatedSR = undefined

    let index = 0
    do {
        const currentSR = samplingRateList[index]
        if (samplingRate / currentSR < 2) { calculatedSR = currentSR }

        if (index < samplingRateList.length - 1) {
            const nextSR = samplingRateList[index + 1]
            if (samplingRate / nextSR >= 0.95 && samplingRate / nextSR <= 1.05) { calculatedSR = nextSR }
        }

        index += 1
    } while (!calculatedSR || index == samplingRateList.length)

    if (!calculatedSR) {
        calculatedSR = samplingRateList[samplingRateList.length - 1]
    }

    return calculatedSR
}