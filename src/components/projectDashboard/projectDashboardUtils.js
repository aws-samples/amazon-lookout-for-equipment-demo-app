import { getModelsSummary} from '../modelDeployment/deploymentUtils'
import { getAllProjects } from '../../utils/utils'

// ------------------------------------------------------------
// Get details about the project to build the dashboard summary
// ------------------------------------------------------------
export const getProjectDetails = async (gateway, uid, projectName) => {
    const listProjects = await getAllProjects(gateway, uid)
    const targetTableName = `l4edemoapp-${uid}-${projectName}`
    const listTables = await gateway.dynamoDbListTables()
    const tableAvailable = (listTables['TableNames'].indexOf(targetTableName) >= 0)
    
    let errorMessage = ""
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