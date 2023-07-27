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

export function cleanList(itemsToRemove, targetList) {
    itemsToRemove.forEach((item) => {
        const index = targetList.indexOf(item)
        targetList.splice(index, 1)
    })

    return targetList
}

// ==========================================================
// Get all the models linked to a given L4E project / dataset
// ==========================================================
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

// ==============================================
// Get all the projects listed under this account
// ==============================================
export async function getAllProjects() {
    const folders = await Storage.list('', { pageSize: "ALL"})
        .then(({ results }) => { return listFolders(results) })
        .catch((err) => console.log(err))

    let projects = []
    folders.forEach((folder) => {
        projects.push(folder.split('/')[1])
    })

    return projects
}

// ==================================================
// Get all the models for all the projects / datasets
// ==================================================
export async function getAllModels(gateway, projects) {
    let modelsList = {}

    const promises = Array.from(projects).map(async project => {
        const modelsList = await getModelList(gateway, project)
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

// ==================================
export const getSchedulerStatus = async (gateway, currentModel) => {
    let status = undefined
    const response = await gateway.lookoutEquipment.listInferenceSchedulers(currentModel)
    if (response['InferenceSchedulerSummaries'].length > 0) {
        status = response['InferenceSchedulerSummaries'][0]['Status']
    }

    return status
}

// ==================================
export async function getAllSchedulers(gateway, models) {
    let schedulersList = {}
    let allPromises = []
    for (const project of Object.keys(models)) {
        const promises = Array.from(models[project]).map(async model => {
            const schedulerStatus = await getSchedulerStatus(gateway, model)

            return {
                project: project,
                model: model,
                schedulerStatus: schedulerStatus
            }
        })

        allPromises = [...allPromises, ...promises]
    }

    const allSchedulers = await Promise.all(allPromises)

    allSchedulers.forEach((scheduler) => {
        if (scheduler['schedulerStatus']) {
            const currentProject = scheduler['project']

            if (!schedulersList[currentProject]) { schedulersList[currentProject] = [] }

            schedulersList[currentProject].push(scheduler['model'])
        }
    })

    return schedulersList
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