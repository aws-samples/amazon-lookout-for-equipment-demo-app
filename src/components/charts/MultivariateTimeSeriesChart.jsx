// Imports:
import { useRef, useContext } from 'react'
import ReactEcharts from "echarts-for-react"

// Application components:
import ModelDataRanges from "../modelTraining/ModelDataRanges"

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
import Box          from "@cloudscape-design/components/box"
import Container    from "@cloudscape-design/components/container"
import Form         from "@cloudscape-design/components/form"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Spinner      from "@cloudscape-design/components/spinner"
import TextContent  from "@cloudscape-design/components/text-content"

// Contexts:
import TimeSeriesContext from '../contexts/TimeSeriesContext'
import ModelParametersContext from '../contexts/ModelParametersContext'

// Utils:
import { getLegendWidth, getCurrentISODate } from '../../utils/utils.js'
import { buildChartOptions } from '../../utils/timeseries.js'
import "../../styles/chartThemeMacarons.js"

// ---------------------
// Component entry point
// ---------------------
function MultivariateTimeSeriesChart({ showLegend, showToolbox, componentHeight, enableBrush }) {
    const { data, tagsList, x, signals, timeseriesData } = useContext(TimeSeriesContext)
    const { trainingRange, evaluationRange, numTrainingDays, numEvaluationDays, labels, totalLabelDuration } = useContext(ModelParametersContext)
    
    const initialZoomStart = useRef(0)
    const initialZoomEnd = useRef(10)
    const modelDataRangesRef = useRef(undefined)
    const eChartRef = useRef(null)

    const { datasetName } = useContext(ModelParametersContext)
    const queryParameters = new URLSearchParams(window.location.search)
    datasetName.current = queryParameters.get("model_name")

    if (!componentHeight) { componentHeight = 700 }

    // --------------------------------------------------------------------------
    // This function is used to update the training and evaluation ranges both in
    // in date pickers and the datazoom component of the time series chart.
    // --------------------------------------------------------------------------
    function updateRanges() {
        const numDataPoints = x.length
        const trainingDataStart = new Date(x[parseInt(initialZoomStart.current / 100 * numDataPoints)])
        const trainingDataEnd = new Date(x[parseInt(initialZoomEnd.current / 100 * numDataPoints) - 1])
        let evaluationDataStart = new Date(x[parseInt(initialZoomEnd.current / 100 * numDataPoints) - 1])
        evaluationDataStart.setSeconds(evaluationDataStart.getSeconds() + 1)
        const evaluationDataEnd = new Date(x[x.length - 1])
    
        trainingRange.current = {
            type: 'absolute', 
            startDate: getCurrentISODate(trainingDataStart),
            endDate: getCurrentISODate(trainingDataEnd)
        }
        evaluationRange.current = {
            type: 'absolute', 
            startDate: getCurrentISODate(evaluationDataStart),
            endDate: getCurrentISODate(evaluationDataEnd)
        }
        numTrainingDays.current = parseInt((trainingDataEnd - trainingDataStart) / 1000 / 86400).toString() + " day(s)"
        numEvaluationDays.current = parseInt((evaluationDataEnd - evaluationDataStart) / 1000 / 86400).toString() + " day(s)"
    }

    // ------------------------------------------------------
    // Once the data is loaded, we can display the component:
    // ------------------------------------------------------
    if (!data.timeseries) {
        return (
            <Alert header="Data preparation in progress">
                Data preparation and ingestion in the app still in progress: after uploading your
                dataset, the app prepares it to optimize visualization speed. This step usually 
                takes 10 to 20 minutes depending on the size of the dataset you uploaded.
            </Alert>
        )
    }
    else if (data) {
        const legendWidth = getLegendWidth(tagsList)

        if (!trainingRange.current) {
            updateRanges()
        }
        else {
            initialZoomStart.current = parseInt((new Date(trainingRange.current['startDate']) - new Date(x[0])) / (new Date(x[x.length - 1]) - new Date(x[0])) * 100)
            initialZoomEnd.current = parseInt((new Date(trainingRange.current['endDate']) - new Date(x[0])) / (new Date(x[x.length - 1]) - new Date(x[0])) * 100)
        }

        const option = buildChartOptions(
            tagsList, 
            timeseriesData,
            initialZoomStart.current, 
            initialZoomEnd.current, 
            showLegend, 
            showToolbox, 
            legendWidth,
            enableBrush,
            true,                   // customDatazoomColor,
            false,                  // readOnly
            5                       // Show top 5 signals after loading
        )

        // --------------------------------------------------------
        // When the user changes the data zoom range, we update the
        // training and evaluation range. This must be in sync with
        // the data ranges date pickers
        // --------------------------------------------------------
        const onDataZoomEnd = (e) => {
            if (e['type'] && e['type'] == 'datazoom') {
                initialZoomStart.current = e['start']
                initialZoomEnd.current = e['end']
                updateRanges()
                modelDataRangesRef.current.forceUpdate()
            }
        }

        // ----------------------------------------------------------
        // Compute the total duration of the labels located in the
        // training range. L4E must have at least 90 days of training
        // data available. This will help show the users when they
        // are below this treshold:
        // ----------------------------------------------------------
        function updateLabelDuration(currentLabels) {
            let totalDuration = 0

            if (currentLabels && currentLabels.length > 0) {    
                const trainingEndDate = new Date(trainingRange.current.endDate)
        
                currentLabels.forEach((label) => {
                    let labelEndDate = new Date(x[label['end']])
                    if (trainingEndDate < labelEndDate) {
                        labelEndDate = trainingEndDate
                    }
                    const duration = labelEndDate - new Date(x[label['start']])
        
                    totalDuration += duration
                })
        
                totalLabelDuration.current = totalDuration
            }
        }

        // -----------------------------------------------------------------
        // The user can use brushes to highlight labels directly on the plot
        // -----------------------------------------------------------------
        const onBrushEndEvent = (e) => {
            let currentRanges = []
            e["areas"].forEach((area) => {
                currentRanges.push({
                    "start": area.coordRange[0],
                    "end": area.coordRange[1]
                })
            })

            labels.current = currentRanges
            updateLabelDuration(labels.current)
            modelDataRangesRef.current.forceUpdate()
        }

        // ---------------------------------------------------------
        // This function is triggered when the chart is finished 
        // rendering. If some labels where highlighted using eCharts 
        // brushes, then we recreate them.
        // ---------------------------------------------------------
        const onChartReady = (e) => {
            if (eChartRef && eChartRef.current) {
                if (labels.current.length > 0) {
                    let areasList = []
                    labels.current.forEach((label) => {
                        areasList.push({
                            brushType: 'lineX',
                            coordRange: [label['start'], label['end']],
                            xAxisIndex: 0
                        })
                    })

                    eChartRef.current.getEchartsInstance().dispatchAction({
                        type: 'brush',
                        areas: areasList
                    })
                }
            }
        }

        // ---------------------
        // Renders the component
        // ---------------------
        return (
            <Container>
                <SpaceBetween size="l">
                    <TextContent>
                        Training range selection: use the slider below to highlight the time
                        range that will be used for training a Lookout for Equipment model. 
                        The remaining data located after this range will be used for evaluation
                        purpose:
                    </TextContent>

                    <Container>
                    <ReactEcharts 
                        option={option}
                        theme="macarons"
                        style={{ height: componentHeight, width: "100%" }}
                        ref={eChartRef}
                        onEvents={{
                            'datazoom': onDataZoomEnd, 
                            'brushEnd': onBrushEndEvent
                        }}
                        onChartReady={onChartReady}
                    />
                    </Container>

                    <Box>
                        <ModelDataRanges ref={modelDataRangesRef} x={x} updateRanges={updateRanges} />
                    </Box>
                </SpaceBetween>
            </Container>
        )
    }
    else {
        return (
            <Spinner />
        )
    }
}

export default MultivariateTimeSeriesChart