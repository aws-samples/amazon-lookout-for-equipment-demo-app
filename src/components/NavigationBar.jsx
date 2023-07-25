// Imports:
import { useContext, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// CloudScape components:
import SideNavigation from '@cloudscape-design/components/side-navigation'
import Spinner from '@cloudscape-design/components/spinner'

// Contexts:
import ApiGatewayContext from './contexts/ApiGatewayContext'

// Utils:
import { getAllModels, getAllProjects, getAllSchedulers } from '../utils/utils'

let navItems = []

// ===============================================
// Builds the project list based on the available 
// folders in the S3 bucket linked to this Amplify 
// application
// ===============================================
const buildHierarchy = async (gateway, currentModel, currentProject) => {
    let items = []

    // Extracts all the projects, models and schedulers visible from this account:
    const projects = await getAllProjects()
    const modelsList = await getAllModels(gateway, projects)
    const schedulersList = await getAllSchedulers(gateway, modelsList)

    console.log('schedulersList:', schedulersList)

    // Loops through each project to create the hierarchy for each of them:
    projects.forEach((project) => {
        let currentItems ={
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
            let offLineResultsItems = []

            currentModels.forEach((model) => {
                offLineResultsItems.push({ 
                    type: 'link', 
                    text: model,
                    href: `/offline-results/modelName/${model}/projectName/${project}`
                })
            })

            currentItems['items'].push(
                {
                    type: 'expandable-link-group',
                    text: 'Offline results',
                    items: offLineResultsItems
                },
                { 
                    type: 'link', 
                    text: 'Model deployment', 
                    href: '/model-deployment/projectName/' + project
                }
            )
        }

        // If some models were already *deployed* in this project, 
        // we list them under a new "Online / live results" section:
        const currentSchedulers = schedulersList[project]
        console.log(currentSchedulers)
        if (currentSchedulers.length > 0) {
            let onlineResultsItems = []

            currentSchedulers.forEach((model) => {
                onlineResultsItems.push({ 
                    type: 'link', 
                    text: model,
                    href: `/online-results/modelName/${model}/projectName/${project}`
                })
            })

            currentItems['items'].push(
                {
                    type: 'expandable-link-group',
                    text: 'Online results',
                    items: onlineResultsItems
                }
            )
        }

        items.push(currentItems)

        console.log(items)
    })

    // Builds the main navigation items array 
    // that will feed the side navigation bar:
    navItems = [
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

// ===========================
// Component main entrey point
// ===========================
function NavigationBar({ activeHref }) {
    const { gateway } = useContext(ApiGatewayContext)
    const [navItems, setNavItems] = useState([])
    const navigate = useNavigate()
    const { modelName, projectName } = useParams()

    // Builds the hierarchy:
    useEffect(() => {
        buildHierarchy(gateway, modelName, projectName)
        .then((x) => setNavItems(x))
    }, [])

    // Renders the side navigation bar:
    const NavBar = () => {
        if (navItems) {
            return (
                <SideNavigation 
                    items={navItems} 
                    header={{ text: 'Home', href: '/' }} 
                    activeHref={activeHref}
                    onFollow={event => {
                        event.preventDefault()
                        navigate(event['detail']['href'])
                    }}
            />
            )
        }
        else {
            return <Spinner />
        }
    }

    return (<NavBar />)
}

export default NavigationBar