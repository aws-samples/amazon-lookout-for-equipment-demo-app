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
            if (model['DatasetName'] === lookoutEquipmentProjectName) {
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
export async function getSchedulerData(gateway, projectName, stateMachinesList) {
    const modelSummary = await getModelsSummary(gateway, projectName)
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