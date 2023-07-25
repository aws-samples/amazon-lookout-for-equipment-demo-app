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

function OfflineResults() {
    const [ modelDetails, setModelDetails ] = useState(undefined)
    const { gateway } = useContext(ApiGatewayContext)
    const { modelName, projectName } = useParams()
    
    useEffect(() => {
        getModelDetails(gateway, modelName, projectName)
        .then((x) => setModelDetails(x))
    }, [gateway, modelName, projectName])

    return (
        <AppLayout
            contentType="default"
            content={
                <ContentLayout header={ <Header variant="h1">Offline results for {modelName} model</Header> }>
                    <SpaceBetween size='xl'>
                        <ModelOverview modelDetails={modelDetails} modelName={modelName} />
                        {modelDetails && <DetectedEvents modelDetails={modelDetails} />}
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