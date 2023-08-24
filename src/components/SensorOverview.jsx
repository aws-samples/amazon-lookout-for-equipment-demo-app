// Imports:
import { useState } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import SignalGradingTable from './sensorOverview/SignalGradingTable'
import UnivariateSignalPlotPanel from './sensorOverview/UnivariateSignalPlotPanel'

// CloudScape Components:
import AppLayout     from "@cloudscape-design/components/app-layout"
import ContentLayout from "@cloudscape-design/components/content-layout"
import Header        from "@cloudscape-design/components/header"
import SpaceBetween  from "@cloudscape-design/components/space-between"

// Utils:
import useSplitPanel from '../utils/splitPanel'

// =========================================================
// Component main entry point for the sensor overview screen
// =========================================================
function SensorOverview() {
    const { projectName } = useParams()
    const [ selectedItems, setSelectedItems ] = useState([]);
    const { splitPanelOpen, onSplitPanelToggle, splitPanelSize, onSplitPanelResize } = useSplitPanel(selectedItems)

    const changeSelectedItems = (newSelection) => {
        setSelectedItems(newSelection)
    }

    // ---------------------
    // Renders the component
    // ---------------------
    return (
        <AppLayout
            contentType="default"
            content={
                <ContentLayout header={<Header variant="h1">{projectName} sensor overview</Header>}>
                    <SpaceBetween size="xl">
                        <SignalGradingTable 
                            projectName={projectName}
                            selectedItems={selectedItems}
                            changeSelectedItems={changeSelectedItems}
                        />
                    </SpaceBetween>
                </ContentLayout>
            }
            splitPanelOpen={splitPanelOpen}
            onSplitPanelToggle={onSplitPanelToggle}
            splitPanelSize={splitPanelSize}
            onSplitPanelResize={onSplitPanelResize}
            splitPanel={<UnivariateSignalPlotPanel projectName={projectName} selectedItems={selectedItems} />}
            navigation={<NavigationBar activeHref={"/sensor-overview/projectName/" + projectName} />}
        />
    )
}

export default SensorOverview