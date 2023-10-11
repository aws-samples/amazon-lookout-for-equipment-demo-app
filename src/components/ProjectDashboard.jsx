// Imports:
import { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import DatasetSummary from './projectDashboard/DatasetSummary'
import OnlineMonitoringSummary from './projectDashboard/OnlineMonitoringSummary'
import DeleteProjectModal from './projectDashboard/DeleteProjectModal'

// Contexts:
import ApiGatewayContext from './contexts/ApiGatewayContext'
import HelpPanelContext from './contexts/HelpPanelContext'

// CloudScape Components:
import Alert             from "@cloudscape-design/components/alert"
import Box               from "@cloudscape-design/components/box"
import Button            from "@cloudscape-design/components/button"
import AppLayout         from "@cloudscape-design/components/app-layout"
import Container         from "@cloudscape-design/components/container"
import ContentLayout     from "@cloudscape-design/components/content-layout"
import ExpandableSection from "@cloudscape-design/components/expandable-section"
import Header            from "@cloudscape-design/components/header"
import Icon              from "@cloudscape-design/components/icon"
import SpaceBetween      from "@cloudscape-design/components/space-between"
import Spinner           from "@cloudscape-design/components/spinner"

// Utils:
import { getProjectDetails } from './projectDashboard/projectDashboardUtils'

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
    const [ progressBar, setProgressBar ]                       = useState('.')
    const [ time, setTime]                                      = useState(Date.now())

    const { gateway, uid } = useContext(ApiGatewayContext)
    const { helpPanelOpen, setHelpPanelOpen, panelContent } = useContext(HelpPanelContext)

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
    }, [gateway, projectName, time])

    // This effect will trigger a refresh of the project
    // dashboard every 30s until dataset ingestion is done:
    useEffect(() => {
        const startTime = Date.now()
        if (!modelDetails) {
            const interval = setInterval(() => { 
                setTime(Date.now()) 
                setProgressBar('.'.repeat(parseInt((Date.now() - startTime)/(30 * 1000)) + 1))
            }, 30 * 1000)
            return () => { clearInterval(interval) }
        }
    }, [])

    // When data loads successfully, we render the full component:
    let children = ""
    if (!isLoading && modelDetails) {
        children = <>
            <DatasetSummary modelDetails={modelDetails} />
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

                                    <Box>
                                        {Array.from(
                                            { length: progressBar.length }, 
                                            (_, i) => <Icon name="drag-indicator" size="normal" variant="link" />
                                        )}
                                        <Spinner />
                                    </Box>
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
        <AppLayout
            contentType="default"

            toolsOpen={helpPanelOpen.status}
            onToolsChange={(e) => {
                if (!helpPanelOpen.page) {
                    setHelpPanelOpen({
                        status: true,
                        page: 'projectDashboard',
                        section: 'summary'
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
                <ContentLayout header={<Header variant="h1">{projectName} overview</Header>}>
                    <SpaceBetween size="xl">
                        {children}
                    </SpaceBetween>
                </ContentLayout>
            }
            
            navigation={<NavigationBar activeHref={"/project-dashboard/projectName/" + projectName} />}
        />
    )
}

export default ProjectDashboard