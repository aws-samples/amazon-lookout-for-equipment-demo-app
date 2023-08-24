// Imports
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import LabelsManagement from './labelling/LabelsManagement'

// Contexts:
import { TimeSeriesProvider } from './contexts/TimeSeriesContext'
import { ModelParametersProvider } from './contexts/ModelParametersContext'

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

    return (
        <ModelParametersProvider>
            <AppLayout
                contentType="default"
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