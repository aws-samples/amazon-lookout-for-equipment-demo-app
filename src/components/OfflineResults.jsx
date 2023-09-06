// Imports:
import { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar from './NavigationBar'
import ModelOverview from './offlineResults/ModelOverview'
import DetectedEvents from './offlineResults/DetectedEvents'
import { getModelDetails } from '../utils/dataExtraction'

// CloudScape Components:
import AppLayout from "@cloudscape-design/components/app-layout"
import ContentLayout from "@cloudscape-design/components/content-layout"
import Header from "@cloudscape-design/components/header"
import SpaceBetween from "@cloudscape-design/components/space-between"

// Contexts:
import ApiGatewayContext from './contexts/ApiGatewayContext'
import HelpPanelContext from './contexts/HelpPanelContext'

function OfflineResults() {
    const [ modelDetails, setModelDetails ] = useState(undefined)
    const [ loading, setLoading ] = useState(true)
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { helpPanelOpen, setHelpPanelOpen, panelContent } = useContext(HelpPanelContext)
    const { modelName, projectName } = useParams()
    
    useEffect(() => {
        setLoading(true)
        getModelDetails(gateway, modelName, projectName, uid)
        .then((x) => { 
            setModelDetails(x)
            setLoading(false)
        })
    }, [gateway, modelName, projectName])

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
                <ContentLayout header={ <Header variant="h1">Offline results for {modelName} model</Header> }>
                    <SpaceBetween size='xl'>
                        <ModelOverview modelDetails={modelDetails} loading={loading} />
                        {!loading && modelDetails && <DetectedEvents modelDetails={modelDetails} loading={loading} />}
                    </SpaceBetween>
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