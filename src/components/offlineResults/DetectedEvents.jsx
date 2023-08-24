// Imports:
import { useRef } from 'react'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"

// CloudScape Components:
import Alert        from "@cloudscape-design/components/alert"
import Header       from "@cloudscape-design/components/header"
import Container    from "@cloudscape-design/components/container"
import SpaceBetween from "@cloudscape-design/components/space-between"

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
                anomalies,
                5                   // showTopN
            )

            // Renders the component:
            return (
                <Container header={<Header variant="h1">Detected events</Header>}>
                    <SpaceBetween size="xl">
                        <Alert>
                            This section shows the evaluation results of your model when applied on 
                            historical data you selected at training time. From top to bottom, you will find:
                            <ul>
                                <li>The <b>events detected</b> in the evaluation date range (similar to what you can visualize from the AWS console</li>
                                <li>A <b>slider</b> to zoom on the part of interest on the plots</li>
                                <li>
                                    The <b>detected events aggregated by day</b>: this plot can be more useful than the raw events 
                                    detected as it helps filtering out short-lived events that may be considered false positives.
                                </li>
                                <li>
                                    The <b>sensor contribution</b> evolution over time. When Lookout for Equipment identifies a given time range
                                    as an anomaly, it also computes the sensor contribution to this event. Each sensor receives a level of
                                    contribution between 0% and 100%. By default, the top 5 contributors are highlighted: use the legend on the
                                    right to adjust this display.
                                </li>
                                <li>The <b>time series</b> plots of the selected sensors</li>
                            </ul>
                        </Alert>
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