// Imports
import { useContext, useEffect } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import LabelsManagement from './labelling/LabelsManagement'

// Contexts:
import { TimeSeriesProvider } from './contexts/TimeSeriesContext'
import { LabelingContextProvider } from './contexts/LabelingContext'
import { ModelParametersProvider } from './contexts/ModelParametersContext'
import HelpPanelContext from './contexts/HelpPanelContext'

// CloudScape Components:
import Container     from "@cloudscape-design/components/container"
import ContentLayout from "@cloudscape-design/components/content-layout"
import Header        from "@cloudscape-design/components/header"

// ---------------------
// Component entry point
// ---------------------
function Labeling() {
    const { projectName } = useParams()
    const { helpPanelOpen, setHelpPanelOpen, panelContent } = useContext(HelpPanelContext)

    useEffect(() => {
        setHelpPanelOpen({
            status: helpPanelOpen.status,
            page: 'labelling',
            section: 'general'
        })
    }, [])

    return (
        <ModelParametersProvider>
            <ContentLayout header={<Header variant="h1">{projectName} labeling</Header>}>
                <TimeSeriesProvider projectName={projectName}>
                    <LabelingContextProvider>
                        <LabelsManagement />
                    </LabelingContextProvider>
                </TimeSeriesProvider>
            </ContentLayout>
        </ModelParametersProvider>
    )
}

export default Labeling