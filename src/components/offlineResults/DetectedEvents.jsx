// Imports:
import { useRef } from 'react'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"

// CloudScape Components:
import Alert     from "@cloudscape-design/components/alert"
import Header    from "@cloudscape-design/components/header"
import Container from "@cloudscape-design/components/container"

// Utils:
import { buildChartOptions } from './offlineResultsUtils'

function DetectedEvents({ modelDetails }) {
    if (modelDetails && modelDetails['status'] === 'SUCCESS') {
        const dailyAggregation   = modelDetails['dailyAggregation']
        const anomalies          = modelDetails['anomalies']
        const sensorContribution = modelDetails['sensorContribution']
        const tagsList           = modelDetails['tagsList']
        const timeseries         = modelDetails['timeseries']
        const evaluationStart    = new Date(modelDetails['evaluationStart'])
        const option             = useRef(undefined)

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

        // Otherwise, we show several widgets to help the 
        // users process the Lookout for Equipment results:
        if (sensorContribution) {
            // Build the eChart options:
            option.current = buildChartOptions(
                tagsList,
                sensorContribution,
                timeseries,
                evaluationStart,
                modelDetails,
                dailyAggregation,
                anomalies
            )

            // Renders the component:
            return (
                <Container header={<Header variant="h1">Detected events</Header>}>
                    <ReactEcharts 
                        option={option.current}
                        notMerge={true}
                        theme="macarons"
                        style={{height: 830, width: "100%"}}
                    />
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