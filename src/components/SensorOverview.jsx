// Imports:
import { useContext, useEffect, useState } from 'react'
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
    const [ selectedItems, setSelectedItems ] = useState([])
    const { helpPanelOpen, setHelpPanelOpen } = useContext(HelpPanelContext)

    useEffect(() => {
        setHelpPanelOpen({
            status: helpPanelOpen.status,
            page: 'sensorOverview',
            section: 'general'
        })
    }, [])

    const changeSelectedItems = (newSelection) => {
        setSelectedItems(newSelection)
    }

    // ---------------------
    // Renders the component
    // ---------------------
    return (
        <ContentLayout header={<Header variant="h1">{projectName} sensor overview</Header>}>
            <SpaceBetween size="xl">
                <SignalGradingTable 
                    projectName={projectName}
                    selectedItems={selectedItems}
                    changeSelectedItems={changeSelectedItems}
                />
            </SpaceBetween>
        </ContentLayout>
    )
}

export default SensorOverview