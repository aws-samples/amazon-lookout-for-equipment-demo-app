import { getAllModels, getAllProjects, getAllSchedulers, checkProjectAvailability } from '../../utils/utils'

import Icon from "@cloudscape-design/components/icon"

// ===============================================
// Builds the project list based on the available 
// folders in the S3 bucket linked to this Amplify 
// application
// ===============================================
export const buildHierarchy = async (gateway, currentProject, uid) => {
    // If the user ID is not defined yet, we yield an empty response:
    if (!uid) { return undefined }

    let items = []

    // Extracts all the projects, models and schedulers visible from this account:
    const projects = await getAllProjects(gateway, uid)
    const projectsDetails = await gateway.lookoutEquipment.listDatasets(`l4e-demo-app-${uid}-`)
    const modelsList = await getAllModels(gateway, projects, uid)
    const schedulersList = await getAllSchedulers(gateway, modelsList)

    // Loops through each project to create the hierarchy for each of them:
    for (const project of projects) {
        // A project is ready to be exposed in the application when the hourly
        // data is imported into DynamoDB and when the ingestion into the 
        // Lookout for Equipment project is done (meaning the Lookout for Equipment
        // is not only Created but Active):
        const projectAvailable = await checkProjectAvailability(gateway, uid + '-' + project, projectsDetails['DatasetSummaries'])

        // Adapt the icon color to the context:
        let iconType = 'normal'
        if (!projectAvailable) { iconType = 'error' }
        else if (currentProject === project) { iconType = 'link' }

        // Assemble the basic items we always find for all 
        // projects: main dashboard, sensor overview and 
        // modeling screen:
        let currentItems = {
            type: 'section', 
            text: <>
                <Icon name={(currentProject === project) ? 'folder-open' : 'folder'} 
                      variant={iconType} />
                &nbsp;&nbsp;
                <b>{project}</b>
            </>,
            defaultExpanded: (currentProject === project)
        }

        if (!projectAvailable) {
            currentItems['items'] = [
                { type: 'link', text: 'Dashboard', href: '/project-dashboard/projectName/' + project }
            ]
        }
        else {
            currentItems['items'] = [
                { type: 'link', text: 'Dashboard', href: '/project-dashboard/projectName/' + project },
                { type: 'link', text: 'Sensor overview', href: '/sensor-overview/projectName/' + project },
                { type: 'link', text: 'Labeling', href: '/labeling/projectName/' + project }
            ]

            // If some models were already trained in this project, 
            // we list them under a new "Offline results" section:
            const currentModels = modelsList[project]
            if (currentModels.length > 0) {
                const offlineResultsSection = await buildOfflineResultsSection(currentModels, gateway, uid, project)
                currentItems['items'] = [...currentItems['items'], ...offlineResultsSection]
            }
            else {
                currentItems['items'].push(
                    { type: 'link', text: 'Model training', href: '/model-training/projectName/' + project }
                )
            }

            // If some models were already *deployed* in this project, 
            // we list them under a new "Online / live results" section:
            if (schedulersList[project]) {
                const currentSchedulers = schedulersList[project]
                if (currentSchedulers.length > 0) {
                    const onlineMonitoringSection = buildSchedulersSection(currentSchedulers, uid, project)
                    currentItems['items'] = [...currentItems['items'], ...onlineMonitoringSection]
                }
            }
        }

        items.push(currentItems)
    }

    // Builds the main navigation items array 
    // that will feed the side navigation bar:
    const navItems = [
        { type: 'link', text: 'Create project', href: '/create-project' },
        { type: 'divider' },
        { 
            type: 'section',
            text: 'Projects',
            defaultExpanded: true,
            items: items
        }
    ]

    return navItems
}

// --------------------------------------------------------------
// Build the offline results section where the user can visualize 
// model evaluation results after they have been trained
// --------------------------------------------------------------
async function buildOfflineResultsSection(currentModels, gateway, uid, project) {
    let offlineResultsItems = []
    let listModels = currentModels

    // Get all the models attached to this project 
    // and sort them by ascending model name:
    listModels.sort((first, second) => {
        if (first.name > second.name) {
            return 1
        }
        else if (first.name < second.name) {
            return -1
        }
        else {
            return 0
        }
    })

    // Build the items list:
    for (const model of listModels) {
        offlineResultsItems.push({ 
            type: 'link', 
            text: <>
                <Icon 
                    name={model['status'] === 'SUCCESS' ? 'status-positive' : 'status-in-progress'} 
                    variant={model['status'] === 'SUCCESS' ? 'success': 'error'} />
                &nbsp;&nbsp;
                {model['name'].slice(uid.length + 1 + project.length + 1)}
            </>,
            href: `/offline-results/modelName/${model['name'].slice(uid.length + 1 + project.length + 1)}/projectName/${project}`
        })
    }

    // Assemble the offline results section:
    const offlineResultsSection = [
        {
            type: 'expandable-link-group',
            text: 'Model training',
            items: offlineResultsItems,
            href: '/model-training/projectName/' + project
        },
        { 
            type: 'link', 
            text: 'Model deployment', 
            href: '/model-deployment/projectName/' + project
        }
    ]

    return offlineResultsSection
}

// ----------------------------------------------
// Build the online monitoring section where the
// user can visualize  the deployed model results
// ----------------------------------------------
function buildSchedulersSection(currentSchedulers, uid, project) {
    let onlineMonitoringItems = []

    currentSchedulers.forEach((model) => {
        onlineMonitoringItems.push({ 
            type: 'link', 
            text: model.slice(uid.length + 1 + project.length + 1),
            href: `/online-monitoring/modelName/${model.slice(uid.length + 1 + project.length + 1)}/projectName/${project}`
        })
    })

    const onlineMonitoringSection = [
        {
            type: 'expandable-link-group',
            text: 'Online monitoring',
            items: onlineMonitoringItems
        }
    ]

    return onlineMonitoringSection
}