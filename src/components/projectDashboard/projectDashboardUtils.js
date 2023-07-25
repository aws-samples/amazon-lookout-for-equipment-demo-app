// ------------------------------------------------------------
// Get details about the project to build the dashboard summary
// ------------------------------------------------------------
export const getProjectDetails = async (gateway, projectName) => {
    const targetTableName = 'l4edemoapp-' + projectName
    const listTables = await gateway.dynamoDbListTables()
    const tableAvailable = (listTables['TableNames'].indexOf(targetTableName) >= 0)
    let tableStatus = await gateway.dynamoDbDescribeTable(targetTableName)
    tableStatus = tableStatus['Table']['TableStatus']

    if (tableAvailable && tableStatus === 'ACTIVE') {
        let fetchError = false
        const contentHead = await gateway
            .dynamoDbQuery(
                { 
                    TableName: targetTableName,
                    KeyConditionExpression: "sampling_rate = :sr",
                    ExpressionAttributeValues: { ":sr": {"S": "1h"} },
                    Limit: 5
                }
            )
            .catch((error) => { fetchError = true })

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
            .catch((error) => { fetchError = true })

        const rowCounts = await gateway
            .dynamoDbDescribeTable(targetTableName)
            .catch((error) => { fetchError = true })

        if (!fetchError) {
            return {
                contentHead: contentHead,
                contentTail: contentTail,
                rowCounts: rowCounts,
                startDate: contentHead.Items[0]['timestamp']['S'],
                endDate: contentTail.Items[4]['timestamp']['S'],
                firstRow: contentHead.Items[0],
                attributeList: Object.keys(contentHead.Items[0]),
                numSensors: Object.keys(contentHead.Items[0]).length
            }
        }
        else {
            return undefined
        }
    }
    else {
        return undefined
    }
}