// Imports
import { Storage } from 'aws-amplify'
import { listFolders } from './s3_utils'

// -----------------------------------------
// Function to sort a Javascript dictionnary
// Schwartzian transform, making use of the 
// decorate-sort-undecorate idiom:
// -----------------------------------------
export function sortDictionnary(dict, ascending) {
    // Create an array of key-value pairs:
    let items = Object.keys(dict).map(
        (key) => { return [key, dict[key]] }
    )
    
    // Sort the array based on the second element (i.e. the value)
    if (ascending) {
        items.sort(
            (first, second) => { return first[1] - second[1] }
        )
    }
    else {
        items.sort(
            (first, second) => { return second[1] - first[1] }
        )
    }

    // Obtain the list of keys in sorted order of the values.
    var keys = items.map(
        (e) => { return e[0] }
    )

    return keys
}

// ---------------------------------------------
// Get width in pixels given a list of tag names
// ---------------------------------------------
export function getLegendWidth(legendKeys) {
    let maxLength = 0
    legendKeys.forEach((key) => {
        if (key.length > maxLength) {
            maxLength = key.length
        }
    })

    return maxLength * 7 + 25
}

export function getCurrentISODate(date) {
    const tzOffset = -60 // new Date().getTimezoneOffset()
    let currentDate = new Date(date).getTime() - tzOffset*60*1000

    return new Date(currentDate).toISOString()
}

// ----------------------------
// Get human readable file size
// ----------------------------
export function getHumanReadableSize(filesize) {
    let filesizeString = ""

    if (filesize / (1024**4) > 1.0) {
        filesizeString = (filesize / (1024**4)).toFixed(2) + " TB"
    }
    else if (filesize / (1024**3) > 1.0) {
        filesizeString = (filesize / (1024**3)).toFixed(2) + " GB"
    }
    else if (filesize / (1024**2) > 1.0) {
        filesizeString = (filesize / (1024**2)).toFixed(2) + " MB"
    }
    else if (filesize / (1024**1) > 1.0) {
        filesizeString = (filesize / (1024**1)).toFixed(2) + " kB"
    }
    else {
        filesizeString = filesize + " B"
    }

    return filesizeString
}

// ---------------------------------------------------------------------------
// Takes a list and some items to remove. Returns the list without the latters
// ---------------------------------------------------------------------------
export function cleanList(itemsToRemove, targetList) {
    itemsToRemove.forEach((item) => {
        const index = targetList.indexOf(item)
        targetList.splice(index, 1)
    })

    return targetList
}

// ----------------------------------------------------------
// Get all the models linked to a given L4E project / dataset
// ----------------------------------------------------------
export const getModelList = async (gateway, currentProject) => {
    const lookoutEquipmentProjectName = `l4e-demo-app-${currentProject}`

    const modelsList = await gateway.lookoutEquipment.listModels(lookoutEquipmentProjectName)

    let listModelNames = []
    if (modelsList['ModelSummaries'] && modelsList['ModelSummaries'].length > 0) {
        modelsList['ModelSummaries'].forEach((model) => {
            listModelNames.push(model['ModelName'])
        })
    }

    return listModelNames
}

// ----------------------------------------------
// Get all the projects listed under this account
// ----------------------------------------------
export async function getAllProjects(gateway, uid) {
    const projectQuery = { 
        TableName: 'l4edemoapp-projects',
        KeyConditionExpression: "#user = :user",
        ExpressionAttributeNames: {"#user": "user_id"},
        ExpressionAttributeValues: { 
            ":user": {"S": uid}, 
        }
    }

    const response = await gateway.dynamoDbQuery(projectQuery).catch((error) => console.log(error.response))
    const projects = []
    response.Items.forEach((project) => {
        projects.push(project['project']['S'])
    })

    return projects
}

export async function getAllExecutionId(gateway, uid) {
    const projectQuery = { 
        TableName: 'l4edemoapp-projects',
        KeyConditionExpression: "#user = :user",
        ExpressionAttributeNames: {"#user": "user_id"},
        ExpressionAttributeValues: { 
            ":user": {"S": uid}, 
        }
    }

    const response = await gateway.dynamoDbQuery(projectQuery).catch((error) => console.log(error.response))
    const ids = {}
    response.Items.forEach((project) => {
        ids[project['project']['S']] = project['executionId'] ? project['executionId']['S'] : undefined
    })

    return ids
}

// --------------------------------------------------
// Get all the models for all the projects / datasets
// --------------------------------------------------
export async function getAllModels(gateway, projects, uid) {
    let modelsList = {}

    const promises = Array.from(projects).map(async project => {
        const modelsList = await getModelList(gateway, uid + '-' + project)
        return {
            project: project,
            models: modelsList 
        }
    })

    const allModels = await Promise.all(promises)

    allModels.forEach((model) => {
        modelsList[model['project']] = model['models']
    })

    return modelsList
}

// ----------------------------
// Get a given scheduler status
// ----------------------------
export const getSchedulerStatus = async (gateway, currentModel) => {
    let status = undefined
    const response = await gateway.lookoutEquipment.listInferenceSchedulers(currentModel)
    if (response['InferenceSchedulerSummaries'].length > 0) {
        status = response['InferenceSchedulerSummaries'][0]['Status']
    }

    return status
}

// ---------------------------------------
// Get all the scehdulers and their status
// ---------------------------------------
export async function getAllSchedulers(gateway, models) {
    // Get all the existing schedulers at once:
    let allSchedulers = {}
    let response = await gateway.lookoutEquipment.listInferenceSchedulers()
    response = response['InferenceSchedulerSummaries']
    if (response.length > 0) {
        response.forEach((schedulerSummary) => {
            allSchedulers[schedulerSummary['ModelName']] = schedulerSummary['ModelName']
        })
    }

    // Loops through each project to list the schedulers attached to it:
    let listSchedulers = {}
    for (const project of Object.keys(models)) {
        if (models[project] && models[project].length > 0) {
            models[project].forEach((model) => {
                if (allSchedulers[model]) {
                    if (!listSchedulers[project]) { listSchedulers[project] = [] }
                    listSchedulers[project].push(allSchedulers[model])
                }
            })
        }
    }

    return listSchedulers
}

// ---------------------------------------------------------------
// This functions takes a given date (value) and an array. It then 
// searches this array for the first item that is greater than the 
// passed date argument. It then returns the index of this item.
// ---------------------------------------------------------------
export function getIndex(x, value) {
    let foundIndex = undefined

    for (const [index, item] of x.entries()) {
        const currentDate = new Date(item.replace('\n', 'T') + 'Z')
        if (currentDate >= value) {
            foundIndex = index
            break
        }
    }

    return foundIndex
}

// ------------------------------------------------------------
// This function checks whether or not a given project is ready
// ------------------------------------------------------------
export async function checkProjectAvailability(gateway, projectName) {
    let availability = false
    const targetTableName = `l4edemoapp-${projectName}`
    const lookoutEquipmentProjectName = `l4e-demo-app-${projectName}`

    // Checks if the DynamoDB table with the hourly data is available:
    const listTables = await gateway.dynamoDbListTables()
    const tableAvailable = (listTables['TableNames'].indexOf(targetTableName) >= 0)

    // If the table is available, we need it in Active 
    // status (meaning the data import is finished):
    if (tableAvailable) {
        let tableStatus = await gateway.dynamoDbDescribeTable(targetTableName)
        tableStatus = tableStatus['Table']['TableStatus']

        // If the table is active, we need to check if the L4E 
        // dataset/project status is ACTIVE. If it's only CREATED 
        // then, the dataset is created but the data ingestion is 
        // not done:
        if (tableStatus === 'ACTIVE') {
            const response = await gateway.lookoutEquipment.listDatasets()

            response['DatasetSummaries'].forEach((dataset) => {
                if (dataset['DatasetName'] === lookoutEquipmentProjectName && dataset['Status'] === 'ACTIVE') {
                    availability = true
                }
            })
        }
    }

    return availability
}

// -------------------------------------------
// Stops an existing scheduler, wait for it to
// be in 'STOPPED' status and then delete it.
// -------------------------------------------
export async function stopAndDeleteScheduler(gateway, modelName) {
    let status = 'RUNNING'

    await gateway.lookoutEquipment
            .stopInferenceScheduler(modelName + '-scheduler')
            .catch((error) => console.log(error.response))

    do {
        const response = await gateway.lookoutEquipment
            .listInferenceSchedulers(modelName)
            .catch((error) => console.log(error.response))

        if (response['InferenceSchedulerSummaries'].length > 0) {
            status = response['InferenceSchedulerSummaries'][0]['Status']
        }
        else {
            status = 'DELETED'
        }

        // To prevent API call throttling:
        await new Promise(r => setTimeout(r, 1000))

    } while (status !== 'STOPPED')

    await deleteScheduler(gateway, modelName)
}

// -----------------------------------------------------------
// Launch a scheduler delete request and wait for it to finish
// -----------------------------------------------------------
export async function deleteScheduler(gateway, modelName) {
    let status = 'STOPPED'

    await gateway.lookoutEquipment
            .deleteInferenceScheduler(modelName + '-scheduler')
            .catch((error) => console.log(error.response))

    do {
        const response = await gateway.lookoutEquipment
            .listInferenceSchedulers(modelName)
            .catch((error) => console.log(error.response))

        if (response['InferenceSchedulerSummaries'].length > 0) {
            status = response['InferenceSchedulerSummaries'][0]['Status']
        }
        else {
            status = 'DELETED'
        }

        await new Promise(r => setTimeout(r, 1000))

    } while (status !== 'DELETED')
}