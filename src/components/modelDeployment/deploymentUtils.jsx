// CloudScape components:
import Badge        from "@cloudscape-design/components/badge"
import Button       from "@cloudscape-design/components/button"
import SpaceBetween from "@cloudscape-design/components/space-between"

// ------------------------------------------------------------
// Get the model summary, including the scheduler configuration
// ------------------------------------------------------------
export async function getModelsSummary(gateway, projectName, uid) {
    const lookoutEquipmentProjectName = `l4e-demo-app-${projectName}`
    let modelsSummaries = await gateway.lookoutEquipment.listModels(lookoutEquipmentProjectName)
    modelsSummaries = modelsSummaries['ModelSummaries']

    if (modelsSummaries.length > 0) {
        // Get all the existing schedulers at once:
        let listSchedulers = undefined
        let response = await gateway.lookoutEquipment.listInferenceSchedulers()
        response = response['InferenceSchedulerSummaries']
        if (response.length > 0) {
            listSchedulers = {}
            response.forEach((schedulerSummary) => {
                listSchedulers[schedulerSummary['ModelName']] = schedulerSummary
            })
        }

        // Now we can get the list of models:
        let modelsList = []
        for (const model of modelsSummaries) {
            // The ListModels API lists all the models with a name *starting* by 
            // a string. We need to make sure that the current model is actually
            // linked to the right project:
            if (model['DatasetName'] === lookoutEquipmentProjectName && model['ModelName'].slice(0,8) === uid) {
                let modelDetails = {}
                modelDetails['CreatedAt'] = new Date(model['CreatedAt'] * 1000)
                modelDetails['ModelName'] = model['ModelName']
                modelDetails['Status'] = model['Status']
                modelDetails['Scheduler'] = undefined

                if (listSchedulers && listSchedulers[model['ModelName']]) {
                    modelDetails['Scheduler'] = listSchedulers[model['ModelName']]
                }

                modelsList.push(modelDetails)
            }
        }

        return modelsList
    }
    else {
        return undefined
    }
}

// -------------------------------------
// Build the model details table content
// -------------------------------------
export function buildModelTableContent(modelsList, uid, projectName, showModelDeployment, stopScheduler, startScheduler, deleteScheduler) {
    let items = []

    modelsList.forEach((model) => {
        let badgeColor = 'grey'
        switch (model['Status']) {
            case 'SUCCESS': badgeColor = 'green'; break
            case 'FAILED': badgeColor = 'red'; break
            case 'IN_PROGRESS': badgeColor = 'blue'; break
        }

        let schedulerStatus = ''
        if (!model['Scheduler']) {
            schedulerStatus = <Badge>NOT CREATED</Badge>
        }
        else {
            let schedulerBadgeColor = 'grey'
            switch (model['Scheduler']['Status']) {
                case 'STOPPED': schedulerBadgeColor = 'blue'; break
                case 'STOPPING': schedulerBadgeColor = 'blue'; break
                case 'RUNNING': schedulerBadgeColor = 'green'; break
            }
            schedulerStatus = <Badge color={schedulerBadgeColor}>{model['Scheduler']['Status']}</Badge>
        }

        items.push({
            name: model['ModelName'].slice(uid.length + 1 + projectName.length + 1),
            status: <Badge color={badgeColor}>{model['Status']}</Badge>,
            creation: new Date(model['CreatedAt']).toISOString().substring(0,19).replace('T', ' '),
            schedulerStatus: schedulerStatus,
            scheduler: getSchedulerStatus(
                model['Scheduler'], 
                model['Status'], 
                model['ModelName'], 
                showModelDeployment, 
                stopScheduler, 
                startScheduler,
                deleteScheduler
            )
        })
    })

    return items
}

// -----------------------------------------------
// Depending on the current scheduler status for 
// a given model, different actions are available:
// -----------------------------------------------
export function getSchedulerStatus(scheduler, modelStatus, modelName, showModelDeployment, stopScheduler, startScheduler, deleteScheduler) {
    let schedulerActions = ''

    if (!scheduler) {
        schedulerActions = 
            <Button onClick={() => showModelDeployment(modelName)} disabled={modelStatus !== 'SUCCESS'}>
                Deploy this model
            </Button>
    }
    else {
        switch (scheduler['Status']) {
            case 'STOPPED':
                schedulerActions = 
                    <SpaceBetween size="xs" direction="horizontal">
                        <Button onClick={() => startScheduler(modelName)}>Resume</Button>
                        <Button onClick={() => deleteScheduler(modelName)}>Delete</Button> 
                    </SpaceBetween>
                break
            case 'STOPPING':
                    schedulerActions = 
                        <SpaceBetween size="xs" direction="horizontal">
                            <Button disabled={true}>Resume</Button>
                            <Button disabled={true}>Delete</Button> 
                        </SpaceBetween>
                    break
            case 'RUNNING':
                schedulerActions = <Button onClick={() => stopScheduler(modelName)}>Stop</Button> 
                break
            default:
                schedulerActions = ''
        }
    }
    
    return schedulerActions
}

// ---------------------------
// Get scheduler launch status
// ---------------------------
export async function getSchedulerData(gateway, projectName, stateMachinesList, uid) {
    const modelSummary = await getModelsSummary(gateway, projectName, uid)
    const sfnStatus = await getStateMachineStatus(gateway, stateMachinesList)

    return {
        modelSummary: modelSummary,
        sfnStatus: sfnStatus
    }
}

// -------------------------------------
// Get the current state machines status
// -------------------------------------
async function getStateMachineStatus(gateway, arnList) {
    let schedulerLaunched = {}
    const modelList = Object.keys(arnList)

    if (modelList.length > 0) {
        for (const model of modelList) {
            schedulerLaunched[model] = false
            const arn = arnList[model]
            const response = await gateway.stepFunctions.getExecutionHistory(arn)
                .catch((error) => { console.log(error.response) })

            response['events'].forEach((activity) => {
                if (activity['type'] == 'TaskStateExited') {
                    schedulerLaunched[model] = true
                }
            })
        }
    }

    return schedulerLaunched
}

// -----------------------------------------------------
// Get the sampling rate of the model passed as argument
// -----------------------------------------------------
export async function getModelSamplingRate(gateway, modelName) {
    if (!modelName) { return undefined }
    const response = await gateway.lookoutEquipment
                            .describeModel(modelName)
                            .catch((error) => { console.log(error.response) })

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
    let modelSamplingRate = possibleSamplingRate[response['DataPreProcessingConfiguration']['TargetSamplingRate']]

    const possibleSchedulerSamplingRate = {
        300: { label: "5 minutes", value: "PT5M" },
        600: { label: "10 minutes", value: "PT10M" },
        900: { label: "15 minutes", value: "PT15M" },
        1800: { label: "30 minutes", value: "PT30M" },
        3600: { label: "60 minutes", value: "PT1H" }
    }

    let schedulerSROptions = []
    let selectedOption = undefined
    const srKeys = Object.keys(possibleSchedulerSamplingRate)
    srKeys.forEach((sr) => {
        if (sr >= modelSamplingRate) {
            schedulerSROptions.push(possibleSchedulerSamplingRate[sr])
            if (!selectedOption) {
                selectedOption = possibleSchedulerSamplingRate[sr]
            }
        }
    })

    return {
        sr: modelSamplingRate,
        srOptions: schedulerSROptions,
        selectedOption: selectedOption
    }
}