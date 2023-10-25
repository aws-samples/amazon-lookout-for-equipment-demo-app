// Imports:
import { createContext, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import request from '../../utils/request'

const ApiGatewayContext = createContext()

async function queryAllItems(summaryLabel, service, api, payload) {
    let response = undefined
    let currentPayload = {}
    if (payload) { currentPayload = payload }
    let overallResponse = {}
    overallResponse[summaryLabel] = []
    
    do {
        if (!response) {
            response = await request(service, api, currentPayload)
            .catch((error) => console.log(error.response))
        }
        else {
            currentPayload['NextToken'] = response ? response['NextToken'] : ''
            response = await request(service, api, currentPayload)
            .catch((error) => console.log(error.response))
        }

        overallResponse[summaryLabel] = [...overallResponse[summaryLabel], ...response[summaryLabel]]
    } while (response['NextToken'])

    return overallResponse
}

export const ApiGatewayProvider = ({user, children}) => {    
    // Define a unique user ID based on the authenticated user property:
    let uid = undefined
    if (user && user.attributes) {
        uid = user.attributes.sub.split("-")[0]
        if (uid === "") { uid = undefined }
    }

    const [ navbarCounter, setNavbarCounter ] = useState(0)
    const isAdmin = useRef(false)
    const [ showHelp, setShowHelp ] = useState(true)

    // Define all the API request we need for this app:
    const gateway = {
        // ---------------------------
        // Lookout for Equipment calls
        // ---------------------------
        lookoutEquipment: {
            // -------------------
            // Datasets management
            // -------------------
            describeDataset(datasetName) {
                return request("LookoutEquipment", "DescribeDataset", {DatasetName: datasetName})
            },
            async listDatasets(datasetName) {
                if (datasetName) {
                    return queryAllItems(
                        'DatasetSummaries', 
                        'LookoutEquipment', 
                        'ListDatasets', 
                        { DatasetNameBeginsWith: datasetName }
                    )
                }
                else {
                    return queryAllItems(
                        'DatasetSummaries', 
                        'LookoutEquipment', 
                        'ListDatasets'
                    )
                }
            },
            listDataIngestionJobs(datasetName) {
                return request("LookoutEquipment", "ListDataIngestionJobs", {DatasetName: datasetName})
            },
            deleteDataset(datasetName) {
                return request("LookoutEquipment", "DeleteDataset", { DatasetName: datasetName })
            },
            async listSensorStatistics(datasetName, jobId) {
                return queryAllItems(
                    'SensorStatisticsSummaries', 
                    'LookoutEquipment', 
                    'ListSensorStatistics', 
                    { DatasetName: datasetName, IngestionJobId: jobId }
                )
            },

            // -----------------
            // Models management
            // -----------------
            createModel(createRequest) {
                let requestArg = createRequest
                requestArg['ClientToken'] = uuidv4()
    
                return request("LookoutEquipment", "CreateModel", requestArg)
            },
            async listModels(datasetName) {
                if (datasetName) {
                    return queryAllItems(
                        'ModelSummaries', 
                        'LookoutEquipment', 
                        'ListModels', 
                        { DatasetNameBeginsWith: datasetName }
                    )
                }
                else {
                    return queryAllItems(
                        'ModelSummaries', 
                        'LookoutEquipment', 
                        'ListModels'
                    )
                }
            },
            describeModel(modelName) {
                return request("LookoutEquipment", "DescribeModel", {ModelName: modelName})
            },
            deleteModel(modelName) {
                return request("LookoutEquipment", "DeleteModel", {ModelName: modelName})
            },

            // ---------------------
            // Schedulers management
            // ---------------------
            async listInferenceSchedulers(modelName) {
                if (modelName) {
                    return queryAllItems(
                        'InferenceSchedulerSummaries', 
                        'LookoutEquipment', 
                        'ListInferenceSchedulers', 
                        { ModelName: modelName }
                    )
                }
                else {
                    return queryAllItems(
                        'InferenceSchedulerSummaries', 
                        'LookoutEquipment', 
                        'ListInferenceSchedulers'
                    )
                }
            },
            stopInferenceScheduler(schedulerName) {
                return request("LookoutEquipment", "StopInferenceScheduler", {InferenceSchedulerName: schedulerName})
            },
            startInferenceScheduler(schedulerName) {
                return request("LookoutEquipment", "StartInferenceScheduler", {InferenceSchedulerName: schedulerName})
            },
            deleteInferenceScheduler(schedulerName) {
                return request("LookoutEquipment", "DeleteInferenceScheduler", {InferenceSchedulerName: schedulerName})
            },
            describeInferenceScheduler(schedulerName) {
                return request("LookoutEquipment", "DescribeInferenceScheduler", {InferenceSchedulerName: schedulerName})
            },

            // --------------------------------
            // Label and label group management
            // --------------------------------
            createLabelGroup(labelGroupParameters) {
                let requestArg = labelGroupParameters
                requestArg['ClientToken'] = uuidv4()
                requestArg['Tags'] = [
                    {"Key": "Source", "Value": "L4EDemoApp"},
                    {"Key": "AppVersion", "Value": window.version}
                ]

                return request("LookoutEquipment", "CreateLabelGroup", requestArg)
            },
            createLabel(labelParameters) {
                let requestArg = labelParameters
                requestArg['ClientToken'] = uuidv4()
                requestArg['Tags'] = [
                    {"Key": "Source", "Value": "L4EDemoApp"},
                    {"Key": "AppVersion", "Value": window.version}
                ]

                return request("LookoutEquipment", "CreateLabel", requestArg)
            },
            listLabelGroups(groupNameBeginsWith) {
                // We don't use pagination to collect more than 50 label groups 
                // with this query. It's unlikely that more than 50 label groups
                // will be created for a given dataset:
                return request("LookoutEquipment", "ListLabelGroups", {LabelGroupNameBeginsWith: groupNameBeginsWith})
            },
            async listLabels(labelGroupName) {
                return queryAllItems(
                    'LabelSummaries', 
                    'LookoutEquipment', 
                    'ListLabels', {
                        LabelGroupName: labelGroupName
                    }
                )
            },
            deleteLabelGroup(labelGroupName) {
                return request("LookoutEquipment", "DeleteLabelGroup", {LabelGroupName: labelGroupName})
            },
            deleteLabel(labelGroupName, labelId) {
                return request("LookoutEquipment", "DeleteLabel", {
                    LabelGroupName: labelGroupName,
                    LabelId: labelId
                })
            }
        },

        // --------------------
        // Step Functions calls
        // --------------------
        stepFunctions: {
            startExecution(arn, input) {
                return request("StepFunctions", "StartExecution", {
                    stateMachineArn: arn,
                    input: JSON.stringify(input)
                })
            },
            getExecutionHistory(arn) {
                return request("StepFunctions", "GetExecutionHistory", {executionArn: arn})
            },
            describeExecution(executionArn) {
                return request("StepFunctions", "DescribeExecution", {executionArn: executionArn})
            }
        },
    
        // ---------------
        // DynamobDB calls
        // ---------------
        dynamoDb: {
            describeTable(tableName) {
                return request("DynamoDB", "DescribeTable", { TableName: tableName })
            },
            async listTables() {
                let response = undefined
                let overallResponse = {TableNames: []}
                let LastEvaluatedTableName = undefined
    
                do {
                    if (!response) {
                        response = await request("DynamoDB", "ListTables")
                                         .catch((error) => console.log(error.response))
                    }
                    else {
                        LastEvaluatedTableName = response['LastEvaluatedTableName']
                        response = await request("DynamoDB", "ListTables", {ExclusiveStartTableName: LastEvaluatedTableName})
                                         .catch((error) => console.log(error.response))
                    }
    
                    overallResponse['TableNames'] = [...overallResponse['TableNames'], ...response['TableNames']]
    
                } while (response['LastEvaluatedTableName'])
    
                return overallResponse
            },
            deleteTable(tableName) {
                return request("DynamoDB", "DeleteTable", { TableName: tableName })
            },
            deleteItem(tableName, key) {
                return request("DynamoDB", "DeleteItem", { TableName: tableName, Key: key })
            },
            putItem(tableName, item) {
                return request("DynamoDB", "PutItem", { TableName: tableName, Item: item })
            },
            query(query) {
                return request("DynamoDB", "Query", query)
            },
            scan(query) {
                return request("DynamoDB", "Scan", query)
            },
            async queryAll(query) {
                let response = undefined
                let overall_response = {Items: []}
                let lastEvaluatedKey = undefined
    
                do {
                    if (!response) {
                        response = await request("DynamoDB", "Query", query)
                                         .catch((error) => console.log(error.response))
                    }
                    else {
                        lastEvaluatedKey = response['LastEvaluatedKey']
                        response = await request("DynamoDB", "Query", {...query, ExclusiveStartKey: lastEvaluatedKey})
                                         .catch((error) => console.log(error.response))
                    }
    
                    overall_response['Items'] = [...overall_response['Items'], ...response['Items']]
    
                } while (response['LastEvaluatedKey'])
    
                return overall_response
            },
        },

        // ----------------
        // Timestream calls
        // ----------------
        timestream: {
            async listDatabases() {
                return queryAllItems(
                    'Databases', 
                    'TimestreamWrite', 
                    'ListDatabases'
                )
            },
            async listTables(databaseName) {
                return queryAllItems(
                    'Tables', 
                    'TimestreamWrite', 
                    'ListTables',
                    { DatabaseName: databaseName }
                )
            },
            async query(query) {
                let response = undefined
                let overall_response = {Rows: []}
                let nextToken = undefined
    
                do {
                    if (!response) {
                        response = await request("TimestreamQuery", "Query", {QueryString: query})
                                         .catch((error) => console.log(error.response))
                    }
                    else {
                        nextToken = response['NextToken']
                        response = await request("TimestreamQuery", "Query", {QueryString: query, NextToken: nextToken})
                                         .catch((error) => console.log(error.response))
                    }

                    overall_response['Rows'] = [...overall_response['Rows'], ...response['Rows']]
    
                } while (response['NextToken'])
    
                return overall_response
            }
        }
    }

    return (
        <ApiGatewayContext.Provider value={{ 
            gateway, 
            uid, 
            navbarCounter, 
            showHelp,
            isAdmin,
            
            setNavbarCounter,
            setShowHelp
        }}>
            {children}
        </ApiGatewayContext.Provider>
    )
}

export default ApiGatewayContext