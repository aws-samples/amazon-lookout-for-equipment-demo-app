import { getModelsSummary} from '../modelDeployment/deploymentUtils'
import { getAllProjects } from '../../utils/utils'

// ------------------------------------------------------------
// Get details about the project to build the dashboard summary
// ------------------------------------------------------------
export const getProjectDetails = async (gateway, projectName) => {
    const listProjects = await getAllProjects()
    const targetTableName = 'l4edemoapp-' + projectName
    const listTables = await gateway.dynamoDbListTables()
    const tableAvailable = (listTables['TableNames'].indexOf(targetTableName) >= 0)
    
    let errorMessage = ""
    if (listProjects.indexOf(projectName)) {
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

                const rowCounts = await gateway
                    .dynamoDbDescribeTable(targetTableName)
                    .catch(() => { fetchError = true })

                if (!fetchError) {
                    return {
                        projectDetails: {
                            contentHead: contentHead,
                            contentTail: contentTail,
                            rowCounts: rowCounts,
                            startDate: contentHead.Items[0]['timestamp']['S'],
                            endDate: contentTail.Items[4]['timestamp']['S'],
                            firstRow: contentHead.Items[0],
                            attributeList: Object.keys(contentHead.Items[0]),
                            numSensors: Object.keys(contentHead.Items[0]).length
                        },
                        errorMessage: ""
                    }
                }
            }
        }
    }
    else {
        errorMessage = "Project not found"
    }

    return {
        projectDetails: undefined,
        errorMessage: errorMessage
    }
}

// --------------------------------------------------------------
// Collects the models and schedulers attached to a given project
// --------------------------------------------------------------
export async function getProjectData(gateway, projectName) {
    let listModels = []
    let listSchedulers = []
    const models = await getModelsSummary(gateway, projectName)

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

    return {
        listModels, 
        listSchedulers
    }
}