// Imports:
import { useContext } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import ModelOverview from './offlineResults/ModelOverview'
import DetectedEvents from './offlineResults/DetectedEvents'
import SignalHistograms from './offlineResults/SignalHistograms'

// CloudScape Components:
import AppLayout        from "@cloudscape-design/components/app-layout"
import ContentLayout    from "@cloudscape-design/components/content-layout"
import Header           from "@cloudscape-design/components/header"
import SpaceBetween     from "@cloudscape-design/components/space-between"
import Tabs             from "@cloudscape-design/components/tabs"

// Contexts:
import HelpPanelContext from './contexts/HelpPanelContext'
import { OfflineResultsProvider } from './contexts/OfflineResultsContext'

function OfflineResults() {
    const { helpPanelOpen, setHelpPanelOpen, panelContent } = useContext(HelpPanelContext)
    const { modelName, projectName } = useParams()

    return (
        <AppLayout
            contentType="default"

            toolsOpen={helpPanelOpen.status}
            onToolsChange={(e) => {
                if (!helpPanelOpen.page) {
                    setHelpPanelOpen({
                        status: true,
                        page: 'offlineResults',
                        section: 'modelOverview'
                    })
                }
                else {
                    setHelpPanelOpen({
                        status: e.detail.open,
                        page: helpPanelOpen.page,
                        section: helpPanelOpen.section
                    })
                }
            }}
            tools={panelContent.current}

            content={
                <ContentLayout header={ <Header variant="h1">Offline results for {modelName} model</Header> }>
                    <OfflineResultsProvider>
                        <SpaceBetween size='xl'>
                            <ModelOverview />

                            <Tabs
                                tabs={[
                                    {
                                        label: "Detected events",
                                        id: "detectedEvents",
                                        content: <DetectedEvents />
                                    },
                                    {
                                        label: "Signal deep dive",
                                        id: "signalDeepDive",
                                        content: <SignalHistograms />
                                    }
                                ]} 
                            />
                        </SpaceBetween>
                    </OfflineResultsProvider>
                </ContentLayout>
            }
            navigation={
                <NavigationBar
                    activeHref={`/offline-results/modelName/${modelName}/projectName/${projectName}`}
                />}
        />
    )
}

export default OfflineResults