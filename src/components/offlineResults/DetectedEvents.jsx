// Imports:
import { useContext, useRef } from 'react'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"

// CloudScape Components:
import Alert        from "@cloudscape-design/components/alert"
import Header       from "@cloudscape-design/components/header"
import Container    from "@cloudscape-design/components/container"
import Link         from "@cloudscape-design/components/link"
import SpaceBetween from "@cloudscape-design/components/space-between"

// Contexts:
import HelpPanelContext from '../contexts/HelpPanelContext'
import ApiGatewayContext from '../contexts/ApiGatewayContext'
import OfflineResultsContext from '../contexts/OfflineResultsContext'

// Utils:
import { buildChartOptions } from './offlineResultsUtils'
import { cleanList } from '../../utils/utils'

function DetectedEvents() {
    const { modelDetails }     = useContext(OfflineResultsContext)
    const { setHelpPanelOpen } = useContext(HelpPanelContext)
    const { showHelp }         = useContext(ApiGatewayContext)

    if (modelDetails && modelDetails['status'] === 'SUCCESS') {
        const dailyAggregation     = modelDetails['dailyAggregation']
        const anomalies            = modelDetails['anomalies']
        const sensorContribution   = modelDetails['sensorContribution']
        let tagsList               = modelDetails['tagsList']
        const timeseries           = modelDetails['timeseries']
        const evaluationStart      = new Date(modelDetails['evaluationStart'])
        const option               = useRef(undefined)

        // If no sensor contribution contribution data is found, this means 
        // that no anomalous event was found while evaluating the model. 
        // Hence, nothing to show here:
        if (!sensorContribution) {
            return (
                <Container header={<Header variant="h1">Detected events</Header>}>
                    No event detected by this model
                </Container>
            )
        }

        const tagsToRemove = ['asset', 'sampling_rate', 'timestamp', 'unix_timestamp']
        tagsList = cleanList(tagsToRemove, tagsList)

        // Otherwise, we show several widgets to help the 
        // users process the Lookout for Equipment results:
        if (sensorContribution) {
            // Build the eChart options:
            option.current = buildChartOptions(
                tagsList,
                sensorContribution.Items,
                timeseries.Items,
                evaluationStart,
                modelDetails,
                dailyAggregation.Items,
                anomalies.Items,
                5                   // showTopN
            )

            const infoLink = (
                <Link variant="info" onFollow={() => setHelpPanelOpen({
                    status: true,
                    page: 'offlineResults',
                    section: 'detectedEvents'
                })}>Info</Link>
            )

            // Renders the component:
            return (
                <Container header={
                    <Header 
                        variant="h1"
                        info={infoLink}
                    >Detected events</Header>
                }>
                    <SpaceBetween size="xl">
                        { showHelp.current && <Alert>
                            This section shows the evaluation results of your model when applied on historical data you
                            selected at training time. To learn more about how to interpret these plots, click on
                            the <b>{infoLink}</b> link above.
                        </Alert> }

                        <ReactEcharts 
                            option={option.current}
                            notMerge={true}
                            theme="macarons"
                            style={{height: 830, width: "100%"}}
                        />
                    </SpaceBetween>
                </Container>
            )
        }

        // If no sensor contribution contribution data is found, this means 
        // that no anomalous event was found while evaluating the model. 
        // Hence, nothing to show here:
        else {
            return (
                <Container header={<Header variant="h1">Detected events</Header>}>
                    <Alert>No event detected by this model over the evaluation phase</Alert>
                </Container>
            )
        }
    }
}

export default DetectedEvents