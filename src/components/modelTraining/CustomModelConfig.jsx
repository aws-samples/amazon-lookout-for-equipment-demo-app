// Imports
import { useRef } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import MultivariateTimeSeriesChart from '../charts/MultivariateTimeSeriesChart'
import ModelingSignalSelection     from './ModelingSignalSelection'
import CreateModelSummary          from './CreateModelSummary'
import ModelConfiguration          from './ModelConfiguration'
import LabelsManagement            from '../labelling/LabelsManagement'

// CloudScape Components:
import Box           from "@cloudscape-design/components/box"
import Button        from "@cloudscape-design/components/button"
import SpaceBetween  from "@cloudscape-design/components/space-between"
import Tabs          from "@cloudscape-design/components/tabs"

function CustomModelConfig() {
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
        <SpaceBetween size="xxs">
            <Box>
                Use the following tabs to explore your dataset and configure a model to be trained.
                Then click <b>Create model</b> to create a new model based on the selected parameters.
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
                        content: <LabelsManagement readOnly={true} />
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
    )
}

export default CustomModelConfig