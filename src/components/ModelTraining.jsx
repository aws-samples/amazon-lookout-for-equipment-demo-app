// Imports
import { useContext, useState } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import CustomModelConfig from './modelTraining/CustomModelConfig'
import DefaultModelConfig from './modelTraining/DefaultModelConfig'

// Contexts:
import { TimeSeriesProvider } from './contexts/TimeSeriesContext'
import { ModelParametersProvider } from './contexts/ModelParametersContext'
import HelpPanelContext from './contexts/HelpPanelContext'

// CloudScape Components:
import AppLayout     from "@cloudscape-design/components/app-layout"
import ContentLayout from "@cloudscape-design/components/content-layout"
import Header        from "@cloudscape-design/components/header"
import SegmentedControl from "@cloudscape-design/components/segmented-control"

// ---------------------
// Component entry point
// ---------------------
function ModelTraining() {
    const { projectName } = useParams()
    const [ trainingConfig, setTrainingConfig ] = useState("default")
    const { helpPanelOpen, setHelpPanelOpen, panelContent } = useContext(HelpPanelContext)

    return (
        <ModelParametersProvider>
            <TimeSeriesProvider projectName={projectName}>
                { /* --------------------------- *
                   * Default model training view * 
                   * --------------------------- */ }
                { trainingConfig === "default" && <AppLayout
                    contentType="default"
                    toolsOpen={helpPanelOpen.status}
                    onToolsChange={(e) => {
                        if (!helpPanelOpen.page) {
                            setHelpPanelOpen({
                                status: true,
                                page: 'modelTraining',
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
                        <ContentLayout header={
                            <Header 
                                variant="h1"
                                description={
                                    <SegmentedControl
                                        selectedId={trainingConfig}
                                        onChange={({ detail }) => setTrainingConfig(detail.selectedId) }
                                        label="Default segmented control"
                                        options={[
                                            { text: "Default configuration", id: "default" },
                                            { text: "Custom configuration", id: "custom" }
                                        ]}
                                    />
                                }>{projectName} exploration and modeling
                            </Header>
                        }>    
                            <DefaultModelConfig />
                        </ContentLayout>
                    }
                    navigation={
                        <NavigationBar activeHref={"/model-training/projectName/" + projectName} />}
                /> }

                { /* -------------------------- *
                   * Custom model training view * 
                   * -------------------------- */ }
                { trainingConfig === "custom" && <AppLayout
                    contentType="default"
                    toolsOpen={helpPanelOpen.status}
                    onToolsChange={(e) => {
                        if (!helpPanelOpen.page) {
                            setHelpPanelOpen({
                                status: true,
                                page: 'modelTraining',
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
                    maxContentWidth={Number.MAX_VALUE}
                    content={
                        <CustomModelConfig trainingConfig={trainingConfig} setTrainingConfig={setTrainingConfig} />
                    }
                    navigation={
                        <NavigationBar activeHref={"/model-training/projectName/" + projectName} />}
                /> }

            </TimeSeriesProvider>
        </ModelParametersProvider>
    )
}

export default ModelTraining