// Imports:
import { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import DatasetSummary from './dashboard/DatasetSummary'
import OnlineMonitoringSummary from './dashboard/OnlineMonitoringSummary'

// Contexts:
import ApiGatewayContext from './contexts/ApiGatewayContext'

// CloudScape Components:
import Alert            from "@cloudscape-design/components/alert"
import AppLayout        from "@cloudscape-design/components/app-layout"
import Container        from "@cloudscape-design/components/container"
import ContentLayout    from "@cloudscape-design/components/content-layout"
import Header           from "@cloudscape-design/components/header"
import SpaceBetween     from "@cloudscape-design/components/space-between"
import Spinner          from "@cloudscape-design/components/spinner"

// Utils:
import { getProjectDetails } from './projectDashboard/projectDashboardUtils'

// --------------------------
// Main component entry point
// --------------------------
function ProjectDashboard() {
    const { projectName } = useParams()
    const [ modelDetails, setModelDetails ] = useState(undefined)
    const [ errorMessage, setErrorMessage ] = useState("undefined")
    const [ isLoading, setIsLoading ] = useState(true)
    const { gateway } = useContext(ApiGatewayContext)

    useEffect(() => {
        getProjectDetails(gateway, projectName)
        .then(({projectDetails, errorMessage}) => { 
            setModelDetails(projectDetails)
            setErrorMessage(errorMessage)
            setIsLoading(false)
        })
    }, [gateway, projectName])

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
                                Data preparation and ingestion in the app still in progress: after uploading your
                                dataset, the app prepares it to optimize visualization speed. This step usually takes
                                10 to 20 minutes depending on the size of the dataset you uploaded.
                            </Alert>
                        </Container>
        }

        // If loading is done and an error message was issued,
        // this usually means this page does not exist:
        else if (!isLoading && errorMessage !== "") {
            children = <Container header={<Header variant="h1">Summary</Header>}>
                            <Alert header="Error" type="error">{errorMessage}</Alert>
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