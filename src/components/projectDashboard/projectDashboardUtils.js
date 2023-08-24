import { getModelsSummary} from '../modelDeployment/deploymentUtils'
import { getAllProjects, getAllExecutionId } from '../../utils/utils'

// ------------------------------------------------------------
// Get details about the project to build the dashboard summary
// ------------------------------------------------------------
export const getProjectDetails = async (gateway, uid, projectName) => {
    const listProjects = await getAllProjects(gateway, uid)
    const targetTableName = `l4edemoapp-${uid}-${projectName}`
    const listTables = await gateway.dynamoDbListTables()
    const tableAvailable = (listTables['TableNames'].indexOf(targetTableName) >= 0)
    const executionIds = await getAllExecutionId(gateway, uid)
    
    let errorMessage = ""
    let errorDetails = undefined
    if (listProjects.indexOf(uid + '-' + projectName)) {
        if (tableAvailable) {
            let tableStatus = await gateway.dynamoDbDescribeTable(targetTableName)
            tableStatus = tableStatus['Table']['TableStatus']

            if (tableStatus === 'ACTIVE') {
                let fetchError = false

                const contentHead = await gateway
                    .dynamoDbQuery({ 
                        TableName: targetTableName,
                        KeyConditionExpression: "sampling_rate = :sr",
                        ExpressionAttributeValues: { ":sr": {"S": "1h"} },
                        Limit: 5
                    })
                    .catch(() => { fetchError = true })

                const contentTail = await gateway
                    .dynamoDbQuery(
                        { 
                            TableName: targetTableName,
                            KeyConditionExpression: "sampling_rate = :sr",
                            ExpressionAttributeValues: { ":sr": {"S": "1h"} },
                            Limit: 5,
                            ScanIndexForward: false
                        }
                    )
                    .catch(() => { fetchError = true })

                const rowCounts = await getRowsNumber(gateway, uid, projectName)

                if (!fetchError) {
                    return {
                        projectDetails: {
                            contentHead: contentHead,
                            contentTail: contentTail,
                            rowCounts: rowCounts,
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
async function getRowsNumber(gateway, uid, projectName) {
    const projectQuery = { 
        TableName: 'l4edemoapp-projects',
        KeyConditionExpression: "#user = :user AND #project = :project",
        ExpressionAttributeNames: {"#user": "user_id", "#project": "project"},
        ExpressionAttributeValues: { 
            ":user": {"S": uid},
            ":project": {"S": projectName}
        }
    }

    const response = await gateway.dynamoDbQuery(projectQuery).catch((error) => console.log(error.response))

    return response.Items[0]['numRows']['N']
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