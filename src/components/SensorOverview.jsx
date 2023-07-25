// Imports:
import { useState } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import SignalGradingTable from './sensorOverview/SignalGradingTable'
import UnivariateTimeSeriesChart from './sensorOverview/UnivariateTimeSeriesChart'

// Contexts
import { TimeSeriesProvider  } from './contexts/TimeSeriesContext'
import { SensorOverviewProvider } from './contexts/SensorOverviewContext'

// CloudScape Components:
import AppLayout from "@cloudscape-design/components/app-layout"
import Alert from "@cloudscape-design/components/alert"
import ContentLayout from "@cloudscape-design/components/content-layout"
import Header from "@cloudscape-design/components/header"
import SpaceBetween from "@cloudscape-design/components/space-between"
import SplitPanel from "@cloudscape-design/components/split-panel"

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
    
    // ------------------------------------------
    // Get the actual content of the split panel:
    // ------------------------------------------
    const getPanelContent = (sensorName) => {
        if (sensorName) {
            return {
                header: "Details for signal: " + sensorName,
                body: <UnivariateTimeSeriesChart sensorName={sensorName} />
            }
        }
        else {
            return {
                header: "Select a row in the signal grading table",
                body:
                    <Alert>
                        Select a row in the table above to plot the time 
                        series of the signal and a histogram of the values
                        it takes over time.
                    </Alert>
            }
        }
    }
    
    // -------------------------------------
    // Build the content of the split panel:
    // -------------------------------------
    function UnivariateSignalPlotPanel() {
        let sensorName = undefined
        if (selectedItems.length > 0) {
            sensorName = selectedItems[0]['SensorName']
        }
    
        const { header: panelHeader, body: panelBody } = getPanelContent(sensorName)
        return (
            <SplitPanel header={panelHeader} hidePreferencesButton={true}>
                {panelBody}
            </SplitPanel>
        )
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
            splitPanel={
                <TimeSeriesProvider projectName={projectName}>
                    <SensorOverviewProvider>
                        <UnivariateSignalPlotPanel />
                    </SensorOverviewProvider>
                </TimeSeriesProvider>
            }
            navigation={<NavigationBar activeHref={"/sensor-overview/projectName/" + projectName} />}
        />
    )
}

export default SensorOverview