// Imports
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import CustomModelConfig from './modelTraining/CustomModelConfig'
import DefaultModelConfig from './modelTraining/DefaultModelConfig'

// Contexts:
import { TimeSeriesProvider } from './contexts/TimeSeriesContext'
import { ModelParametersProvider } from './contexts/ModelParametersContext'
import HelpPanelContext from './contexts/HelpPanelContext'

// CloudScape Components:
import ContentLayout    from "@cloudscape-design/components/content-layout"
import Header           from "@cloudscape-design/components/header"
import SegmentedControl from "@cloudscape-design/components/segmented-control"

// ---------------------
// Component entry point
// ---------------------
function ModelTraining() {
    const { projectName } = useParams()
    const [ trainingConfig, setTrainingConfig ] = useState("default")
    const { helpPanelOpen, setHelpPanelOpen, panelContent } = useContext(HelpPanelContext)

    useEffect(() => {
        setHelpPanelOpen({
            status: helpPanelOpen.status,
            page: 'modelTraining',
            section: 'general'
        })
    }, [])

    return (
        <ModelParametersProvider>
            <TimeSeriesProvider projectName={projectName}>
                { /* --------------------------- *
                   * Default model training view * 
                   * --------------------------- */ }
                { trainingConfig === "default" && 
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

                { /* -------------------------- *
                   * Custom model training view * 
                   * -------------------------- */ }
                { trainingConfig === "custom" && 
                    <CustomModelConfig 
                        trainingConfig={trainingConfig} 
                        setTrainingConfig={setTrainingConfig} 
                    />
                }

            </TimeSeriesProvider>
        </ModelParametersProvider>
    )
}

export default ModelTraining