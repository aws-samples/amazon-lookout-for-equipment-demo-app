import { getAllModels, getAllProjects, getAllSchedulers } from '../../utils/utils'

// ===============================================
// Builds the project list based on the available 
// folders in the S3 bucket linked to this Amplify 
// application
// ===============================================
export const buildHierarchy = async (gateway, currentProject) => {
    let items = []

    // Extracts all the projects, models and schedulers visible from this account:
    const projects = await getAllProjects()
    const modelsList = await getAllModels(gateway, projects)
    const schedulersList = await getAllSchedulers(gateway, modelsList)

    // Loops through each project to create the hierarchy for each of them:
    projects.forEach((project) => {
        // Assemble the basic items we always find for all 
        // projects: main dashboard, sensor overview and 
        // modeling screen:
        let currentItems = {
            type: 'expandable-link-group', 
            href: '/project-dashboard/projectName/' + project,
            text: project, 
            defaultExpanded: (currentProject === project),
            items: [
                { type: 'link', text: 'Dashboard', href: '/project-dashboard/projectName/' + project },
                { type: 'link', text: 'Sensor overview', href: '/sensor-overview/projectName/' + project },
                { type: 'link', text: 'Exploration & Modeling', href: '/exploration-modeling/projectName/' + project }
            ]
        }

        // If some models were already trained in this project, 
        // we list them under a new "Offline results" section:
        const currentModels = modelsList[project]
        if (currentModels.length > 0) {
            const offlineResultsSection = buildOfflineResultsSection(currentModels, project)
            currentItems['items'] = [...currentItems['items'], ...offlineResultsSection]
        }

        // If some models were already *deployed* in this project, 
        // we list them under a new "Online / live results" section:
        const currentSchedulers = schedulersList[project]
        if (currentSchedulers.length > 0) {
            const onlineMonitoringSection = buildSchedulersSection(currentSchedulers, project)
            currentItems['items'] = [...currentItems['items'], ...onlineMonitoringSection]
        }

        items.push(currentItems)
    })

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
function buildOfflineResultsSection(currentModels, project) {
    let offlineResultsItems = []

    currentModels.forEach((model) => {
        offlineResultsItems.push({ 
            type: 'link', 
            text: model,
            href: `/offline-results/modelName/${model}/projectName/${project}`
        })
    })

    const offlineResultsSection = [
        {
            type: 'expandable-link-group',
            text: 'Offline results',
            items: offlineResultsItems
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
function buildSchedulersSection(currentSchedulers, project) {
    let onlineMonitoringItems = []

    currentSchedulers.forEach((model) => {
        onlineMonitoringItems.push({ 
            type: 'link', 
            text: model,
            href: `/online-monitoring/modelName/${model}/projectName/${project}`
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