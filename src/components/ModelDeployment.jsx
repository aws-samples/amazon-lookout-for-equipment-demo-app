// Imports:
import { useContext, useEffect } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import ListModels from './modelDeployment/ListModels'

// Cloudscape components:
import ContentLayout from "@cloudscape-design/components/content-layout"
import Header        from "@cloudscape-design/components/header"

// Contexts:
import { ModelDeploymentProvider } from "./contexts/ModelDeploymentContext"
import HelpPanelContext from './contexts/HelpPanelContext'

function ModelDeployment() {
    const { projectName } = useParams()
    const { helpPanelOpen, setHelpPanelOpen } = useContext(HelpPanelContext)

    useEffect(() => {
        setHelpPanelOpen({
            status: helpPanelOpen.status,
            page: 'modelDeployment',
            section: 'general'
        })
    }, [])

    return (
        <ContentLayout header={ <Header variant="h1">Deployment management for asset {projectName}</Header> }>
            <ModelDeploymentProvider>
                <ListModels projectName={projectName} />
            </ModelDeploymentProvider>
        </ContentLayout>
    )
}

export default ModelDeployment