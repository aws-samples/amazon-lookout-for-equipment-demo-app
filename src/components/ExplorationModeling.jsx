// Imports
import { useRef } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import MultivariateTimeSeriesChart from './charts/MultivariateTimeSeriesChart'
import ModelingSignalSelection from './explorationModeling/ModelingSignalSelection'
import CreateModelSummary from './explorationModeling/CreateModelSummary'
import ModelConfiguration from './explorationModeling/ModelConfiguration'
import LabelsManagement from './explorationModeling/LabelsManagement'

// Contexts:
import { TimeSeriesProvider } from './contexts/TimeSeriesContext'
import { ModelParametersProvider } from './contexts/ModelParametersContext'

// CloudScape Components:
import AppLayout from "@cloudscape-design/components/app-layout"
import Box from "@cloudscape-design/components/box"
import Button from "@cloudscape-design/components/button"
import Container from "@cloudscape-design/components/container"
import ContentLayout from "@cloudscape-design/components/content-layout"
import Header from "@cloudscape-design/components/header"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Tabs from "@cloudscape-design/components/tabs"

// ---------------------
// Component entry point
// ---------------------
function ExplorationModeling() {
    const { projectName } = useParams()
    const modelSummaryRef = useRef(null)
    const showModelSummary = useRef(false)

    const toggleModelSummary = (e) => {
        e.preventDefault()
        showModelSummary.current = !showModelSummary.current
        modelSummaryRef.current.showModal(showModelSummary.current)
    }

    const dismissModelSummary = () => {
        showModelSummary.current = false
    }

    return (
        <ModelParametersProvider>
            <AppLayout
                contentType="default"
                content={
                    <ContentLayout header={<Header variant="h1">{projectName} exploration and modeling</Header>}>
                        <Container>
                            <TimeSeriesProvider projectName={projectName}>
                                <SpaceBetween size="xxs">
                                    <Box>
                                        Use the following tabs to explore your dataset and configure a model to be trained.
                                        Then click <b>Train model</b> to create a new model based on the selected parameters.
                                        <Box float="right">
                                            <Button variant="primary" onClick={toggleModelSummary}>Create model</Button>
                                        </Box>
                                    </Box>
                                    <Tabs
                                        tabs={[
                                            {
                                                label: "Training data range",
                                                id: "ranges",
                                                content: <MultivariateTimeSeriesChart 
                                                            showLegend={true} 
                                                            showToolbox={false} 
                                                            componentHeight={500}
                                                            enableBrush={false}
                                                        />
                                            },
                                            {
                                                label: "Signal selection",
                                                id: "signals",
                                                content: <ModelingSignalSelection />
                                            },
                                            {
                                                label: 'Labels',
                                                id: 'labelConfiguration',
                                                content: <LabelsManagement />
                                            },
                                            {
                                                label: "Model configuration",
                                                id: "modelConfiguration",
                                                content: <ModelConfiguration />,
                                            }
                                        ]}
                                    />
                                    <CreateModelSummary ref={modelSummaryRef} dismissFunction={dismissModelSummary} projectName={projectName} />
                                </SpaceBetween>
                            </TimeSeriesProvider>
                        </Container>
                    </ContentLayout>
                }
                navigation={
                    <NavigationBar activeHref={"/exploration-modeling/projectName/" + projectName} />}
            />
        </ModelParametersProvider>
    )
}

export default ExplorationModeling