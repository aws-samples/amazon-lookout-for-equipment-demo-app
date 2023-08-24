// Imports:
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import ListModels from './modelDeployment/ListModels'

// Cloudscape components:
import AppLayout from "@cloudscape-design/components/app-layout"
import ContentLayout from "@cloudscape-design/components/content-layout"
import Header from "@cloudscape-design/components/header"
import SpaceBetween from "@cloudscape-design/components/space-between"

// Contexts:
import { ModelDeploymentProvider  } from "./contexts/ModelDeploymentContext"

function ModelDeployment() {
    const { projectName } = useParams()
    return (
        <AppLayout
            contentType="default"
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