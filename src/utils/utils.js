// Imports
import * as awsui from '@cloudscape-design/design-tokens/index.js'
import { histogram } from 'echarts-stat'
import { Octokit } from "@octokit/core"
import { DateTime } from "luxon"

// --------------------------------------
// Search in which bin a given date falls
// --------------------------------------
export function binarySearchBins(bins, date) {
    let low = 0
    let high = bins.length - 1
    
    while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        const bin = bins[mid];

        if (date >= bin.start && date <= bin.end) {
            return mid
        } else if (date < bin.start) {
            high = mid - 1
        } else {
            low = mid + 1
        }
    }
  
    return -1
}

// -------------------------------
// Computes a normalized histogram
// -------------------------------
export function normalizedHistogram(values) {
    const numValues = values.length
    let bins = histogram(values)

    bins.data.forEach((bin, index) => {
        bins.data[index][1] = bins.data[index][1] / numValues
    })

    return bins
}

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

// -------------------------------------------------------
// Return number of matches found when filtering as a text
// -------------------------------------------------------
export function getMatchesCountText(count) {
    return count === 1 ? '1 match' : `${count} matches`
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

    return parseInt(maxLength * 5.54 + 91)
}

export function getCurrentISODate(date) {
    const tzOffset = -60 // new Date().getTimezoneOffset()
    let currentDate = new Date(date).getTime() - tzOffset*60*1000
    currentDate = new Date(currentDate).toISOString()
    
    return currentDate
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

// ---------------------------
// Get human readable duration
// ---------------------------
export function getHumanReadableTime(milliseconds) {
    let hours = 0
    let minutes = 0
    let seconds = 0
    let remainingTime = milliseconds
    let timeString = ''

    if (remainingTime > 3600*1000) {
        hours = parseInt(remainingTime / (3600*1000))
        remainingTime -= hours * 3600*1000
        timeString += `${hours}h `
    }

    if (remainingTime > 60*1000) {
        minutes = parseInt(remainingTime / (60*1000))
        remainingTime -= minutes * 60*1000
        timeString += `${minutes}mn `
    }

    if (remainingTime > 1000) {
        seconds = parseInt(remainingTime / (1000))
        remainingTime -= seconds * 1000
        timeString += `${seconds}s`
    }

    return timeString
}

// ---------------------------------------------------------------------------
// Takes a list and some items to remove. Returns the list without the latters
// ---------------------------------------------------------------------------
export function cleanList(itemsToRemove, targetList) {
    itemsToRemove.forEach((item) => {
        const index = targetList.indexOf(item)
        if (index >= 0) {
            targetList.splice(index, 1)
        }
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

// ----------------------------------------------------------
// Get all the models linked to a given L4E project / dataset
// Returns the model name and its status
// ----------------------------------------------------------
export const getModelListDetailed = async (gateway, currentProject) => {
    const lookoutEquipmentProjectName = `l4e-demo-app-${currentProject}`

    const modelsList = await gateway.lookoutEquipment.listModels(lookoutEquipmentProjectName)

    let listModelNames = []
    if (modelsList['ModelSummaries'] && modelsList['ModelSummaries'].length > 0) {
        modelsList['ModelSummaries'].forEach((model) => {
            listModelNames.push({
                name: model['ModelName'],
                status: model['Status']
            })
        })
    }

    return listModelNames
}

// ----------------------------------------------
// Get all the projects listed under this account
// ----------------------------------------------
export async function getAllProjects(gateway, uid) {
    const projects = []

    const projectQuery = { 
        TableName: `l4edemoapp-projects-${window.stackId}`,
        KeyConditionExpression: "#user = :user",
        ExpressionAttributeNames: {"#user": "user_id"},
        ExpressionAttributeValues: { 
            ":user": {"S": uid}, 
        }
    }

    const response = await gateway.dynamoDb.queryAll(projectQuery)
                                .catch((error) => console.log(error))

    if (response.Items && response.Items.length > 0) {
        response.Items.forEach((project) => {
            projects.push(project['project']['S'])
        })
    }

    return projects
}

// ------------------------------------------------
// Get all the ingestion step function execution ID 
// for the projects associated to the current user
// ------------------------------------------------
export async function getAllExecutionId(gateway, uid) {
    const ids = {}

    const projectQuery = { 
        TableName: `l4edemoapp-projects-${window.stackId}`,
        KeyConditionExpression: "#user = :user",
        ExpressionAttributeNames: {"#user": "user_id"},
        ExpressionAttributeValues: { 
            ":user": {"S": uid}, 
        }
    }

    const response = await gateway.dynamoDb.queryAll(projectQuery).catch((error) => console.log(error.response))
    response.Items.forEach((project) => {
        ids[project['project']['S']] = project['executionId'] ? project['executionId']['S'] : undefined
    })

    return ids
}

// --------------------------------------------------
// Get all the models for all the projects / datasets
// --------------------------------------------------
export async function getAllModels(gateway, projects, uid) {
    let allModels = {}
    let response = await gateway.lookoutEquipment.listModels()
    response = response['ModelSummaries']

    // Sort the list of models alphabetically according to the model list:
    response.sort((first, second) => {
        if (first.ModelName > second.ModelName) {
            return 1
        }
        else if (first.ModelName < second.ModelName) {
            return -1
        }
        else {
            return 0
        }
    })

    if (response.length > 0) {
        response.forEach((modelSummary) => {
            allModels[modelSummary['ModelName']] = modelSummary
        })
    }

    let listModels = {}
    for (const project of projects) {
        listModels[project] = []
    }

    // Loops through each project to list the models attached to it:
    for (const model of Object.keys(allModels)) {
        const currentProject = allModels[model].DatasetName.slice('l4e-demo-app'.length + 10)
        const currentUid = model.slice(0,8)

        if (projects.indexOf(currentProject) >= 0 && uid === currentUid) {
            listModels[currentProject].push({
                name: allModels[model].ModelName,
                status: allModels[model].Status
            })
        }
    }

    return listModels
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

    // Sort the list of schedulers according to the model list:
    response.sort((first, second) => {
        if (first.ModelName > second.ModelName) {
            return 1
        }
        else if (first.ModelName < second.ModelName) {
            return -1
        }
        else {
            return 0
        }
    })

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
                if (allSchedulers[model.name]) {
                    if (!listSchedulers[project]) { listSchedulers[project] = [] }
                    listSchedulers[project].push(allSchedulers[model.name])
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
export async function checkProjectAvailability(gateway, projectName, projectsDetails) {
    let availability = false
    const targetTableName = `l4edemoapp-${projectName}`
    const lookoutEquipmentProjectName = `l4e-demo-app-${projectName}`

    // Checks if the DynamoDB table with the hourly data is available:
    const listTables = await gateway.dynamoDb
                                    .listTables()
                                    .catch((error) => console.log(error.response))
    const tableAvailable = (listTables['TableNames'].indexOf(targetTableName) >= 0)

    // If the table is available, we need it in Active 
    // status (meaning the data import is finished):
    if (tableAvailable) {
        let tableStatus = await gateway.dynamoDb
                                       .describeTable(targetTableName)
                                       .catch((error) => console.log(error.response))
        tableStatus = tableStatus['Table']['TableStatus']

        // If the table is active, we need to check if the L4E 
        // dataset/project status is ACTIVE. If it's only CREATED 
        // then, the dataset is created but the data ingestion is 
        // not done:
        if (tableStatus === 'ACTIVE') {
            projectsDetails.forEach((dataset) => {
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

function makeChevronPalette(scales) {
    const scaleCount = scales.length;
    const colorsPerScale = scales[0].length;
    const finalColors = new Array(scaleCount * colorsPerScale);
  
    for (let i = 0; i < scaleCount * colorsPerScale; i++) {
      const round = Math.floor(i / scaleCount);
      const scaleIndex = i % scaleCount;
      const colorIndex = ((scaleIndex % 2 === 0 ? 0 : 2) + ((3 * round) % colorsPerScale)) % colorsPerScale;
      finalColors[i] = scales[scaleIndex][colorIndex];
    }

    console.log(finalColors)

    finalColors.forEach((c, index) => {
        finalColors[index] = c.slice(c.length - 8, c.length - 1)
    })
  
    return finalColors;
  }

export function makeColors() {
  const colors = makeChevronPalette([
    [
        awsui.colorChartsBlue1300,
        // awsui.colorChartsBlue1400,
        awsui.colorChartsBlue1500,
        // awsui.colorChartsBlue1600,
        awsui.colorChartsBlue1700,
        // awsui.colorChartsBlue1800,
        awsui.colorChartsBlue1900,
        // awsui.colorChartsBlue11000,
        awsui.colorChartsBlue11100,
        // awsui.colorChartsBlue11200
    ],
    [
        awsui.colorChartsPink300,
        // awsui.colorChartsPink400,
        awsui.colorChartsPink500,
        // awsui.colorChartsPink600,
        awsui.colorChartsPink700,
        // awsui.colorChartsPink800,
        awsui.colorChartsPink900,
        // awsui.colorChartsPink1000,
        awsui.colorChartsPink1100,
        // awsui.colorChartsPink1200
    ],
    [
        awsui.colorChartsGreen300,
        // awsui.colorChartsGreen400,
        awsui.colorChartsGreen500,
        // awsui.colorChartsGreen600,
        awsui.colorChartsGreen700,
        // awsui.colorChartsGreen800,
        awsui.colorChartsGreen900,
        // awsui.colorChartsGreen1000,
        awsui.colorChartsGreen1100,
        // awsui.colorChartsGreen1200
    ],
    [
        awsui.colorChartsPurple300,
        // awsui.colorChartsPurple400,
        awsui.colorChartsPurple500,
        // awsui.colorChartsPurple600,
        awsui.colorChartsPurple700,
        // awsui.colorChartsPurple800,
        awsui.colorChartsPurple900,
        // awsui.colorChartsPurple1000,
        awsui.colorChartsPurple1100,
        // awsui.colorChartsPurple1200
    ],
    [
        awsui.colorChartsOrange300,
        // awsui.colorChartsOrange400,
        awsui.colorChartsOrange500,
        // awsui.colorChartsOrange600,
        awsui.colorChartsOrange700,
        // awsui.colorChartsOrange800,
        awsui.colorChartsOrange900,
        // awsui.colorChartsOrange1000,
        awsui.colorChartsOrange1100,
        // awsui.colorChartsOrange1200
    ],
  ]);

  return colors
}

// -------------------------------------------------------
// Checks if the project name is already used by this
// user: the project namespace is linked to the 
// currently authenticated user.
// -------------------------------------------------------
export async function checkProjectNameAvailability(projectName, gateway, uid) {
    const projects = await getAllProjects(gateway, uid)
    
    return projects.indexOf(projectName) < 0
}

// --------------------------------------------------------------------
// This function waits for the data processing pipeline to start. This
// allows us to navigate directly to the project dashboard page without 
// triggering any "not found" error
// --------------------------------------------------------------------
export async function waitForPipelineStart(gateway, uid, projectName) {
    let executionIds = await getAllExecutionId(gateway, uid)

    do {
        await new Promise((r) => setTimeout(r, 1000))
        executionIds = await getAllExecutionId(gateway, uid)

    } while (Object.keys(executionIds).indexOf(projectName) < 0)
}

// ------------------------------
// Find an available project name
// ------------------------------
export async function getAvailableDefaultProjectName(gateway, uid) {
    if (!uid) { return undefined }

    const projectsList = await getAllProjects(gateway, uid)

    let defaultProjectName = "Demo-Project"
    let index = 1
    let projectExists = true
    do {
        projectExists = projectsList.indexOf(defaultProjectName) >= 0
        if (projectExists) {
            index += 1
            defaultProjectName = `Demo-Project-${index}`
        }

    } while (projectExists)

    return defaultProjectName
}

// ---------------------------------------------------
// Find an available model name within a given project
// ---------------------------------------------------
export async function getAvailableDefaultModelName(gateway, uid, projectName) {
    const modelsList = await getModelList(gateway, uid + '-' + projectName)

    let defaultModelName = `${uid}-${projectName}-model-1`
    let index = 1
    let modelExists = true
    do {
        modelExists = modelsList.indexOf(defaultModelName) >= 0
        if (modelExists) {
            index += 1
            defaultModelName = `${uid}-${projectName}-model-${index}`
        }

    } while (modelExists)

    return defaultModelName.slice(uid.length + 1 + projectName.length + 1)
}

// ----------------------------------------------------
// Checks if a given label group name is already in use
// ----------------------------------------------------
export async function checkLabelGroupNameAvailability(gateway, uid, projectName, labelGroupName) {
    const currentLabelGroupName = `${uid}-${projectName}-${labelGroupName}`
    const response = await gateway.lookoutEquipment.listLabelGroups(currentLabelGroupName)

    let labelGroupsList = []
    if (response['LabelGroupSummaries'].length > 0) {
        response['LabelGroupSummaries'].forEach((labelGroup) => {
            labelGroupsList.push(labelGroup['LabelGroupName'])
        })
    }

    return labelGroupsList.indexOf(currentLabelGroupName) < 0
}

// ---------------------------------------
// Checks if the app version is the latest
// ---------------------------------------
export async function isLatestVersion() {
    const currentVersion = window.version
    const { latestVersion, releaseInfo, publicationDate } = await getLatestReleaseInfo()

    if (latestVersion) {
        return {
            isLatestVersion: compareVersions(currentVersion, latestVersion) >= 0,
            releaseInfo: releaseInfo,
            publicationDate: publicationDate,
            latestVersion: latestVersion
        }
    }
    
    return false   
}

// --------------------------------------------------------------------
// Query the GitHub API to get the version number of the latest release
// of the Lookout for Equipment demo application
// --------------------------------------------------------------------
async function getLatestReleaseInfo() {
    const octokit = new Octokit()

    try {
        const response = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
            owner: 'aws-samples',
            repo: 'amazon-lookout-for-equipment-demo-app',
            headers: { 'X-GitHub-Api-Version': '2022-11-28' }
        })

        return {
            latestVersion: response.data.tag_name.split('-')[0].slice(1),
            releaseInfo: response.data.body,
            publicationDate: new Date(response.data.published_at).toISOString().replace('T', ' ').substring(0, 19)
        }
    }
    catch (error) {
        console.error('Error checking latest version:', error)
        
        return {
            latestVersion: false,
            releaseInfo: undefined,
            publicationDate: undefined
        }
    }
}

// ---------------------------
// Compare two version numbers
// ---------------------------
function compareVersions(a, b) {
    const partsA = a.split('.').map(Number)
    const partsB = b.split('.').map(Number)

    for (let i = 0; i < 3; i++) {
        if (partsA[i] < partsB[i]) return -1
        if (partsA[i] > partsB[i]) return 1
    }

    return 0
}

export function getUTCDate(date) {
    let UTCDate = DateTime.fromMillis(new Date(date).getTime()).c
    UTCDate = DateTime.utc(
        UTCDate.year, UTCDate.month, UTCDate.day, 
        UTCDate.hour, UTCDate.minute, UTCDate.second
    )
    UTCDate = UTCDate.toISO()

    return new Date(UTCDate)
}