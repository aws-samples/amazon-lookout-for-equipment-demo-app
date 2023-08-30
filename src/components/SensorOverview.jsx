// Imports:
import { useContext, useState } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import SignalGradingTable from './sensorOverview/SignalGradingTable'

// CloudScape Components:
import AppLayout     from "@cloudscape-design/components/app-layout"
import ContentLayout from "@cloudscape-design/components/content-layout"
import Header        from "@cloudscape-design/components/header"
import SpaceBetween  from "@cloudscape-design/components/space-between"

// Contexts:
import HelpPanelContext from './contexts/HelpPanelContext'

// =========================================================
// Component main entry point for the sensor overview screen
// =========================================================
function SensorOverview() {
    const { projectName } = useParams()
    const [ selectedItems, setSelectedItems ] = useState([])
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
            maxContentWidth={Number.MAX_VALUE}
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
                        <SignalGradingTable 
                            projectName={projectName}
                            selectedItems={selectedItems}
                            changeSelectedItems={changeSelectedItems}
                        />
                    </SpaceBetween>
                </ContentLayout>
            }
            navigation={<NavigationBar activeHref={"/sensor-overview/projectName/" + projectName} />}
        />
    )
}

export default SensorOverview