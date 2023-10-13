// Imports:
import { useState, useEffect, useContext, useRef } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import DatasetSummary from './projectDashboard/DatasetSummary'
import OnlineMonitoringSummary from './projectDashboard/OnlineMonitoringSummary'
import DeleteProjectModal from './projectDashboard/DeleteProjectModal'

// Contexts:
import ApiGatewayContext from './contexts/ApiGatewayContext'
import HelpPanelContext from './contexts/HelpPanelContext'

// CloudScape Components:
import Alert             from "@cloudscape-design/components/alert"
import Button            from "@cloudscape-design/components/button"
import Container         from "@cloudscape-design/components/container"
import ContentLayout     from "@cloudscape-design/components/content-layout"
import ExpandableSection from "@cloudscape-design/components/expandable-section"
import Header            from "@cloudscape-design/components/header"
import SpaceBetween      from "@cloudscape-design/components/space-between"
import Spinner           from "@cloudscape-design/components/spinner"

// Utils:
import { getProjectDetails } from './projectDashboard/projectDashboardUtils'
import Refresh from './shared/Refresh'

// --------------------------
// Main component entry point
// --------------------------
function ProjectDashboard() {
    const { projectName } = useParams()
    const [ modelDetails, setModelDetails ]                     = useState(undefined)
    const [ errorMessage, setErrorMessage ]                     = useState("")
    const [ errorDetails, setErrorDetails ]                     = useState(undefined)
    const [ isLoading, setIsLoading ]                           = useState(true)
    const [ showDeleteProjectModal, setShowDeleteProjectModal ] = useState(false)

    const { gateway, uid } = useContext(ApiGatewayContext)
    const { helpPanelOpen, setHelpPanelOpen } = useContext(HelpPanelContext)

    // Refresh component state definition:
    const [ refreshTimer, setRefreshTimer] = useState(Date.now())
    const refreshStartTime  = useRef(Date.now())
    const progressBar = useRef('.')

    useEffect(() => {
        setHelpPanelOpen({
            status: helpPanelOpen.status,
            page: 'projectDashboard',
            section: 'summary'
        })
    }, [])

    useEffect(() => {
        uid && getProjectDetails(gateway, uid, projectName)
        .then(({projectDetails, errorMessage, errorDetails}) => { 
            setModelDetails(projectDetails)
            setErrorMessage(errorMessage)
            setErrorDetails(errorDetails)
            setIsLoading(false)
        })
    }, [gateway, projectName, refreshTimer])

    // When data loads successfully, we render the full component:
    let children = ""
    if (!isLoading && modelDetails) {
        children = <>
            <DatasetSummary modelDetails={modelDetails} setRefreshTimer={setRefreshTimer} />
            <OnlineMonitoringSummary projectName={projectName} />
        </>
    }
    else {
        // If loading is done and data is not available, this means
        // that data ingestion and preparation is still in progress:
        if (!isLoading && !modelDetails & errorMessage === "") {
            children = <Container header={<Header variant="h1">Summary</Header>}>
                            <Alert header="Data preparation in progress">
                                <SpaceBetween size="l">
                                    Data preparation and ingestion in the app still in progress: after uploading your
                                    dataset, the app ingests it into Amazon Lookout for Equipment and also prepares it
                                    to optimize visualization speed. This step usually takes 5 to 20 minutes depending
                                    on the size of the dataset you uploaded.

                                    <Refresh 
                                        refreshTimer={setRefreshTimer} 
                                        refreshInterval={30} 
                                        refreshStartTime={refreshStartTime.current} 
                                        progressBar={progressBar}
                                    />
                                </SpaceBetween>
                            </Alert>
                        </Container>
        }

        // If loading is done and an error message was issued,
        // this usually means this page does not exist:
        else if (!isLoading && errorMessage !== "") {
            children = <Container header={
                            <Header 
                                variant="h1"
                                actions={
                                    <Button 
                                        iconName="status-negative" 
                                        onClick={() => setShowDeleteProjectModal(true)}
                                    >
                                        Delete project
                                    </Button>
                                }
                            >
                                Summary
                            </Header>
                        }>
                            <Alert header="Error" type="error">
                                {errorMessage}
                                {errorDetails && <ExpandableSection headerText="Error details">
                                    <pre>{errorDetails}</pre>
                                </ExpandableSection>}
                            </Alert>

                            <DeleteProjectModal
                                visible={showDeleteProjectModal}
                                onDiscard={() => { setShowDeleteProjectModal(false) }}
                            />
                        </Container>
        }

        // Otherwise, loading is not done yet and we display a spinner:
        else {
            children = <Container header={<Header variant="h1">Summary</Header>}>
                           <Spinner />
                       </Container>
        }
    }

    // Render the component:
    return (
        <ContentLayout header={<Header variant="h1">{projectName} overview</Header>}>
            <SpaceBetween size="xl">
                {children}
            </SpaceBetween>
        </ContentLayout>
    )
}

export default ProjectDashboard