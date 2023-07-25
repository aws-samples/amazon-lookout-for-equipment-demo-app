// CloudScape components:
import Badge        from "@cloudscape-design/components/badge"
import Button       from "@cloudscape-design/components/button"
import SpaceBetween from "@cloudscape-design/components/space-between"

// ------------------------------------------------------------
// Get the model summary, including the scheduler configuration
// ------------------------------------------------------------
export async function getModelsSummary(gateway, projectName) {
    const lookoutEquipmentProjectName = `l4e-demo-app-${projectName}`
    let modelsSummaries = await gateway.lookoutEquipment.listModels(lookoutEquipmentProjectName)
    modelsSummaries = modelsSummaries['ModelSummaries']

    if (modelsSummaries.length > 0) {
        let modelsList = []
        for (const model of modelsSummaries) {
            let modelDetails = {}
            modelDetails['CreatedAt'] = new Date(model['CreatedAt'] * 1000)
            modelDetails['ModelName'] = model['ModelName']
            modelDetails['Status'] = model['Status']
            modelDetails['Scheduler'] = undefined

            let scheduler = await gateway.lookoutEquipment.listInferenceSchedulers(model['ModelName'])
            if (scheduler['InferenceSchedulerSummaries'].length > 0) {
                scheduler = scheduler['InferenceSchedulerSummaries'][0]
                modelDetails['Scheduler'] = scheduler
            }

            modelsList.push(modelDetails)
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
export function buildModelTableContent(modelsList, showModelDeployment, stopScheduler, startScheduler, deleteScheduler, sfnStatus) {
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
                case 'RUNNING': schedulerBadgeColor = 'green'; break
            }
            schedulerStatus = <Badge color={schedulerBadgeColor}>{model['Scheduler']['Status']}</Badge>
        }

        items.push({
            name: model['ModelName'],
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
            case 'RUNNING':
                schedulerActions = <Button onClick={() => stopScheduler(modelName)}>Stop</Button> 
                break
            default:
                schedulerActions = ''
        }
    }
    
    return schedulerActions
}