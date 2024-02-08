// Imports:
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import ModelOverview from './offlineResults/ModelOverview'
import DetectedEvents from './offlineResults/DetectedEvents'
import SignalHistograms from './offlineResults/SignalHistograms'
import AccuracyOverview from './offlineResults/AccuracyOverview'

// CloudScape Components:
import ContentLayout    from "@cloudscape-design/components/content-layout"
import Header           from "@cloudscape-design/components/header"
import SpaceBetween     from "@cloudscape-design/components/space-between"
import Tabs             from "@cloudscape-design/components/tabs"

// Contexts:
import HelpPanelContext from './contexts/HelpPanelContext'
import ApiGatewayContext from './contexts/ApiGatewayContext'
import { OfflineResultsProvider } from './contexts/OfflineResultsContext'

// ------------------------
// Get current model status
// ------------------------
async function getModelStatus(gateway, uid, projectName, modelName) {
    if (!uid) { return undefined }

    let listModels = []
    let response = await gateway.lookoutEquipment.listModels()
    response = response['ModelSummaries']
    response.forEach((model) => { listModels.push(model.ModelName) })

    if (listModels.indexOf(`${uid}-${projectName}-${modelName}`) >= 0) {
        const modelResponse = await gateway.lookoutEquipment
                                        .describeModel(`${uid}-${projectName}-${modelName}`)
                                        .catch((error) => console.log(error.response))

        return modelResponse.Status
    }
    
    return undefined
}

// --------------------------
// Component main entry point
// --------------------------
function OfflineResults() {
    const { helpPanelOpen, setHelpPanelOpen } = useContext(HelpPanelContext)
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { modelName, projectName } = useParams()
    const [ modelStatus, setModelStatus ] = useState(undefined)

    useEffect(() => {
        setHelpPanelOpen({
            status: helpPanelOpen.status,
            page: 'offlineResults',
            section: 'modelOverview'
        })
    }, [])

    useEffect(() => {
        getModelStatus(gateway, uid, projectName, modelName)
        .then((x) => setModelStatus(x))
    }, [gateway, projectName, modelName])

    const tabs = [
        {
            label: "Detected events",
            id: "detectedEvents",
            content: <DetectedEvents />
        },
        {
            label: "Signal deep dive",
            id: "signalDeepDive",
            content: <SignalHistograms />
        },
        {
            label: "Model accuracy overview",
            id: "accuracyOverview",
            content: <AccuracyOverview />
        }
    ]

    // Renders the component
    return (
        <ContentLayout header={ <Header variant="h1">Offline results for {modelName} model</Header> }>
            <OfflineResultsProvider>
                <SpaceBetween size='xl'>
                    <ModelOverview />

                    { modelStatus === 'SUCCESS' ? <Tabs tabs={tabs} /> : null }
                </SpaceBetween>
            </OfflineResultsProvider>
        </ContentLayout>
    )
}

export default OfflineResults