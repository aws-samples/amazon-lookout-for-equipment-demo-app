// Imports
import { useContext } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import LabelsManagement from './labelling/LabelsManagement'

// Contexts:
import { TimeSeriesProvider } from './contexts/TimeSeriesContext'
import { ModelParametersProvider } from './contexts/ModelParametersContext'
import HelpPanelContext from './contexts/HelpPanelContext'

// CloudScape Components:
import AppLayout     from "@cloudscape-design/components/app-layout"
import Container     from "@cloudscape-design/components/container"
import ContentLayout from "@cloudscape-design/components/content-layout"
import Header        from "@cloudscape-design/components/header"

// ---------------------
// Component entry point
// ---------------------
function Labeling() {
    const { projectName } = useParams()
    const { helpPanelOpen, setHelpPanelOpen, panelContent } = useContext(HelpPanelContext)

    return (
        <ModelParametersProvider>
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
                    <ContentLayout header={<Header variant="h1">{projectName} labeling</Header>}>
                        <Container>
                            <TimeSeriesProvider projectName={projectName}>
                                <LabelsManagement />
                            </TimeSeriesProvider>
                        </Container>
                    </ContentLayout>
                }
                navigation={
                    <NavigationBar activeHref={"/labeling/projectName/" + projectName} />}
            />
        </ModelParametersProvider>
    )
}

export default Labeling