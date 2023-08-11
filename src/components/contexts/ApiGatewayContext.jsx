// Imports:
import { createContext, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import request from "../../utils/request";

const ApiGatewayContext = createContext()

export const ApiGatewayProvider = ({user, children}) => {
    // Define a unique user ID based on the authenticated user property:
    let uid = undefined
    if (user && user.attributes) {
        uid = user.attributes.sub.split("-")[0]
    }

    const [ navbarCounter, setNavbarCounter ] = useState(0)

    // Define all the API request we need for this app:
    const gateway = {
        // ---------------------------
        // Lookout for Equipment calls
        // ---------------------------
        lookoutEquipmentDescribeDataset(datasetName) {
            return request("LookoutEquipment", "DescribeDataset", {DatasetName: datasetName})
        },
        lookoutEquipmentListDataIngestionJobs(datasetName) {
            return request("LookoutEquipment", "ListDataIngestionJobs", {DatasetName: datasetName})
        },
        lookoutEquipmentListSensorStatistics(datasetName, jobId) {
            return request("LookoutEquipment", "ListSensorStatistics", {
                DatasetName: datasetName,
                IngestionJobId: jobId
            })
        },
        lookoutEquipmentCreateModel(createRequest) {
            let requestArg = createRequest
            requestArg['ClientToken'] = uuidv4()

            return request("LookoutEquipment", "CreateModel", requestArg)
        },
        lookoutEquipment: {
            // -------------------
            // Datasets management
            // -------------------
            listDatasets(datasetName) {
                if (datasetName) {
                    return request("LookoutEquipment", "ListDatasets", {DatasetNameBeginsWith: datasetName})
                }
                else {
                    return request("LookoutEquipment", "ListDatasets")
                }
            },
            deleteDataset(datasetName) {
                return request("LookoutEquipment", "DeleteDataset", { DatasetName: datasetName })
            },

            // -----------------
            // Models management
            // -----------------
            listModels(datasetName) {
                return request("LookoutEquipment", "ListModels", {DatasetNameBeginsWith: datasetName})
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
            listInferenceSchedulers(modelName) {
                if (modelName) {
                    return request("LookoutEquipment", "ListInferenceSchedulers", {ModelName: modelName})
                }
                else {
                    return request("LookoutEquipment", "ListInferenceSchedulers")
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
            listInferenceExecutions(schedulerName, sinceTimestamp, nextToken) {
                let payload = { InferenceSchedulerName: schedulerName }
                if (sinceTimestamp) { 
                    payload['DataStartTimeAfter'] = sinceTimestamp 
                    payload['DataEndTimeBefore'] = parseInt(Date.now() / 1000)
                }
                if (nextToken) {
                    payload['NextToken'] = nextToken
                }

                return request("LookoutEquipment", "ListInferenceExecutions", payload)
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

                return request("LookoutEquipment", "CreateLabelGroup", requestArg)
            },
            createLabel(labelParameters) {
                let requestArg = labelParameters
                requestArg['ClientToken'] = uuidv4()

                return request("LookoutEquipment", "CreateLabel", requestArg)
            },
            listLabelGroups(groupNameBeginsWith) {
                return request("LookoutEquipment", "ListLabelGroups", {LabelGroupNameBeginsWith: groupNameBeginsWith})
            },
            listLabels(labelGroupName) {
                return request("LookoutEquipment", "ListLabels", {LabelGroupName: labelGroupName})
            },
            deleteLabelGroup(labelGroupName) {
                return request("LookoutEquipment", "DeleteLabelGroup", {LabelGroupName: labelGroupName})
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
        dynamoDbListTables() {
            return request("DynamoDB", "ListTables")
        },
        dynamoDbDescribeTable(tableName) {
            return request("DynamoDB", "DescribeTable", { TableName: tableName })
        },
        dynamoDbQuery(query) {
            return request("DynamoDB", "Query", query)
        },
        dynamoDb: {
            deleteTable(tableName) {
                return request("DynamoDB", "DeleteTable", { TableName: tableName })
            },
            deleteItem(tableName, key) {
                return request("DynamoDB", "DeleteItem", { TableName: tableName, Key: key })
            }
        }
    }

    return (
        <ApiGatewayContext.Provider value={{ gateway, uid, navbarCounter, setNavbarCounter }}>
            {children}
        </ApiGatewayContext.Provider>
    )
}

export default ApiGatewayContext