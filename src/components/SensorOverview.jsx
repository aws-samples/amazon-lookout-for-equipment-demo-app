// Imports:
import { useContext, useState } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import SignalGradingTable from './sensorOverview/SignalGradingTable'
import UnivariateSignalPlotPanel from './sensorOverview/UnivariateSignalPlotPanel'

// CloudScape Components:
import Alert         from "@cloudscape-design/components/alert"
import AppLayout     from "@cloudscape-design/components/app-layout"
import Container     from "@cloudscape-design/components/container"
import ContentLayout from "@cloudscape-design/components/content-layout"
import Header        from "@cloudscape-design/components/header"
import SpaceBetween  from "@cloudscape-design/components/space-between"

// Utils:
import useSplitPanel from '../utils/splitPanel'

// Contexts:
import HelpPanelContext from './contexts/HelpPanelContext'

// =========================================================
// Component main entry point for the sensor overview screen
// =========================================================
function SensorOverview() {
    const { projectName } = useParams()
    const [ selectedItems, setSelectedItems ] = useState([])
    const [ showUserGuide, setShowUserGuide ] = useState(true)
    const { splitPanelOpen, onSplitPanelToggle, splitPanelSize, onSplitPanelResize } = useSplitPanel(selectedItems)
    const { helpPanelOpen, setHelpPanelOpen, panelContent } = useContext(HelpPanelContext)

    const changeSelectedItems = (newSelection) => {
        setSelectedItems(newSelection)
    }

    // ---------------------
    // Renders the component
    // ---------------------
    return (
        <AppLayout
            contentType="default"

            toolsOpen={helpPanelOpen.status}
            onToolsChange={(e) => setHelpPanelOpen({
                status: e.detail.open,
                page: helpPanelOpen.page,
                section: helpPanelOpen.section
            })}
            tools={panelContent.current}

            content={
                <ContentLayout header={<Header variant="h1">{projectName} sensor overview</Header>}>
                    <SpaceBetween size="xl">
                        { showUserGuide && <Container>
                            <Alert dismissible={true} onDismiss={() => setShowUserGuide(false)}>
                                <p>
                                    Once your data is ingested, Amazon Lookout for Equipment will perform a <b>grading</b> of
                                    your individual sensor data with regards to their capability to be good quality signals
                                    for anomaly detection purpose. The following table lets your review the characteristics
                                    of each signal:
                                </p>

                                <ul>
                                    <li>What is the <b>time extent</b> of the signals (start time, end time and number of days)</li>
                                    <li>
                                        Is there a <b>potential issue</b> embedded in the signal (is it categorical, monotonic, is
                                        there any large gap detected...).
                                    </li>
                                    <li>
                                        How many <b>invalid datapoints</b> were detected (missing data, duplicate timestamps...)
                                    </li>
                                </ul>

                                <p>
                                    Check this documentation page to know more about these grading checks.
                                </p>

                                <p>
                                    You can <b>visually review</b> each signal data by clicking on the radio button next to the name
                                    of each signal in the table below. When selected, a panel will open at the bottom of this
                                    page with two plots:
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
                        </Container> }

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