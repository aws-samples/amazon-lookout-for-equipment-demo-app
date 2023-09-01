// Imports
import { useState } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import CustomModelConfig from './modelTraining/CustomModelConfig'
import DefaultModelConfig from './modelTraining/DefaultModelConfig'

// Contexts:
import { TimeSeriesProvider } from './contexts/TimeSeriesContext'
import { ModelParametersProvider } from './contexts/ModelParametersContext'

// CloudScape Components:
import Alert         from "@cloudscape-design/components/alert"
import AppLayout     from "@cloudscape-design/components/app-layout"
import Container     from "@cloudscape-design/components/container"
import ContentLayout from "@cloudscape-design/components/content-layout"
import FormField     from "@cloudscape-design/components/form-field"
import Header        from "@cloudscape-design/components/header"
import SpaceBetween  from "@cloudscape-design/components/space-between"
import Tiles         from "@cloudscape-design/components/tiles"

// ---------------------
// Component entry point
// ---------------------
function ModelTraining() {
    const { projectName } = useParams()
    const [ showUserGuide, setShowUserGuide ] = useState(true)
    const [ trainingConfig, setTrainingConfig ] = useState("default")

    return (
        <ModelParametersProvider>
            <AppLayout
                contentType="default"
                content={
                    <ContentLayout header={<Header variant="h1">{projectName} exploration and modeling</Header>}>
                        <TimeSeriesProvider projectName={projectName}>
                            <SpaceBetween size="l">
                                <Container>
                                    <SpaceBetween size="l">
                                        { showUserGuide && <Alert dismissible={true} onDismiss={() => setShowUserGuide(false)}>
                                            <p>
                                                Now that your data is ingested, you can train an anomaly detection model using 
                                                this page. After training, a model can be deployed to receive fresh data and 
                                                provide live analysis. To train your first models, you can use the <b>default 
                                                configuration</b>. Once you're more familiar with this application and the 
                                                anomalies you want to capture, you will probably want to take the
                                                more <b>customized</b> approach.
                                            </p>
                                        </Alert> }

                                        <FormField 
                                            label="Model configuration mode" 
                                            description="You can either let the application choose some default parameters 
                                                        to train your model, or customize them.">
                                            <Tiles
                                                onChange={({ detail }) => setTrainingConfig(detail.value)}
                                                value={trainingConfig}
                                                items={[
                                                    { value: "default", label: "Default configuration" },
                                                    { value: "custom", label: "Custom configuration" }
                                                ]}
                                            />
                                        </FormField>
                                    </SpaceBetween>
                                </Container>

                                <Container>
                                    { trainingConfig === 'custom' && <CustomModelConfig /> }
                                    { trainingConfig === 'default' && <DefaultModelConfig /> }
                                </Container>
                            </SpaceBetween>
                        </TimeSeriesProvider>
                    </ContentLayout>
                }
                navigation={
                    <NavigationBar activeHref={"/model-training/projectName/" + projectName} />}
            />
        </ModelParametersProvider>
    )
}

export default ModelTraining