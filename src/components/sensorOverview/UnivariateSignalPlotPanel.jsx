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
                    <p>
                        You can <b>visually review</b> each signal data by clicking on the radio button next to the name
                        of each signal in the table on the left. When selected, this section will be updated with the
                        following plots:
                    </p>

                    <ul>
                        <li>A time series plot which will let you review the behavior of the selected sensor</li>
                        <li>
                            A histogram displaying the distribution of the values taken by the selected signal. Use
                            the icons above the time series plot to highlight an area of the time series in green:
                            this will toggle a comparison between the distribution of the selected values (in green)
                            and the distribution of the remaining values (in blue).
                        </li>
                    </ul>
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
        <TimeSeriesProvider projectName={projectName}>
            <SensorOverviewProvider>
                {panelBody}
            </SensorOverviewProvider>
        </TimeSeriesProvider>
    )
}

export default UnivariateSignalPlotPanel