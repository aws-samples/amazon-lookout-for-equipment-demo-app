// Imports:
import { createContext } from 'react'
import { v4 as uuidv4 } from 'uuid'
import request from "../../utils/request";

const ApiGatewayContext = createContext()

export const ApiGatewayProvider = ({children}) => {
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
        lookoutEquipmentDescribeModel(modelName) {
            return request("LookoutEquipment", "DescribeModel", {ModelName: modelName})
        },
        lookoutEquipmentCreateModel(createRequest) {
            let requestArg = createRequest
            requestArg['ClientToken'] = uuidv4()

            return request("LookoutEquipment", "CreateModel", requestArg)
        },
        lookoutEquipment: {
            // -----------------
            // Models management
            // -----------------
            listModels(datasetName) {
                return request("LookoutEquipment", "ListModels", {DatasetNameBeginsWith: datasetName})
            },

            // ---------------------
            // Schedulers management
            // ---------------------
            listInferenceSchedulers(modelName) {
                return request("LookoutEquipment", "ListInferenceSchedulers", {ModelName: modelName})
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

                console.log(payload)

                return request("LookoutEquipment", "ListInferenceExecutions", payload)
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
                console.log('Execution Arn:', arn)
                return request("StepFunctions", "GetExecutionHistory", {executionArn: arn})
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
        }
    }

    return (
        <ApiGatewayContext.Provider value={{ gateway }}>
            {children}
        </ApiGatewayContext.Provider>
    )
}

export default ApiGatewayContext