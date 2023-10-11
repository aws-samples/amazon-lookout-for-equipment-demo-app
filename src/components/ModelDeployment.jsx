// Imports:
import { useContext, useEffect } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import ListModels from './modelDeployment/ListModels'

// Cloudscape components:
import AppLayout     from "@cloudscape-design/components/app-layout"
import ContentLayout from "@cloudscape-design/components/content-layout"
import Header        from "@cloudscape-design/components/header"

// Contexts:
import { ModelDeploymentProvider } from "./contexts/ModelDeploymentContext"
import HelpPanelContext from './contexts/HelpPanelContext'

function ModelDeployment() {
    const { projectName } = useParams()
    const { helpPanelOpen, setHelpPanelOpen, panelContent } = useContext(HelpPanelContext)

    useEffect(() => {
        setHelpPanelOpen({
            status: helpPanelOpen.status,
            page: 'modelDeployment',
            section: 'general'
        })
    }, [])

    return (
        <AppLayout
            contentType="default"
            toolsOpen={helpPanelOpen.status}
            onToolsChange={(e) => {
                if (!helpPanelOpen.page) {
                    setHelpPanelOpen({
                        status: true,
                        page: 'modelDeployment',
                        section: 'general'
                    })
                }
                else {
                    setHelpPanelOpen({
                        status: e.detail.open,
                        page: helpPanelOpen.page,
                        section: helpPanelOpen.section
                    })
                }
            }}
            tools={panelContent.current}
            content={
                <ContentLayout header={ <Header variant="h1">Deployment management for asset {projectName}</Header> }>
                    <ModelDeploymentProvider>
                        <ListModels projectName={projectName} />
                    </ModelDeploymentProvider>
                </ContentLayout>
            }
            navigation={
                <NavigationBar
                    activeHref={`/model-deployment/projectName/${projectName}`}
                />}
        />
        
    )
}

export default ModelDeployment