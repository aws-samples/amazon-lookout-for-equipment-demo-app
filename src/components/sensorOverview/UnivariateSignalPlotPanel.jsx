// App components:
import UnivariateTimeSeriesChart from './UnivariateTimeSeriesChart'

// Contexts
import { TimeSeriesProvider  } from '../contexts/TimeSeriesContext'
import { SensorOverviewProvider } from '../contexts/SensorOverviewContext'

// CloudScape Components:
import Alert        from "@cloudscape-design/components/alert"
import SplitPanel   from "@cloudscape-design/components/split-panel"

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

// ---------------------------------------------
// Build the content of the split panel where 
// the time series of a selected signal is shown
// ---------------------------------------------
function UnivariateSignalPlotPanel({ projectName, selectedItems }) {
    let sensorName = undefined
    if (selectedItems.length > 0) {
        sensorName = selectedItems[0]['SensorName']
    }

    const { header: panelHeader, body: panelBody } = getPanelContent(sensorName)
    return (
        <SplitPanel header={panelHeader} hidePreferencesButton={true}>
            <TimeSeriesProvider projectName={projectName}>
                <SensorOverviewProvider>
                    {panelBody}
                </SensorOverviewProvider>
            </TimeSeriesProvider>
        </SplitPanel>
    )
}

export default UnivariateSignalPlotPanel