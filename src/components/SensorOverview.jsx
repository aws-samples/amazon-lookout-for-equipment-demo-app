// Imports:
import { useContext, useEffect } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import SignalGradingTable from './sensorOverview/SignalGradingTable'

// CloudScape Components:
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
    const { helpPanelOpen, setHelpPanelOpen } = useContext(HelpPanelContext)

    useEffect(() => {
        setHelpPanelOpen({
            status: helpPanelOpen.status,
            page: 'sensorOverview',
            section: 'general'
        })
    }, [])

    // ---------------------
    // Renders the component
    // ---------------------
    return (
        <ContentLayout header={<Header variant="h1">{projectName} sensor overview</Header>}>
            <SpaceBetween size="xl">
                <SignalGradingTable 
                    projectName={projectName}
                    setHelpPanelOpen={setHelpPanelOpen}
                />
            </SpaceBetween>
        </ContentLayout>
    )
}

export default SensorOverview