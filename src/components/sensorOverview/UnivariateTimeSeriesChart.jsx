// Imports:
import { useContext, useRef } from 'react'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"
import { cleanList } from "../../utils/utils.js"
import { buildChartOptions } from "./sensorOverviewUtils"

// CloudScape components:
import Box from "@cloudscape-design/components/box"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Spinner from "@cloudscape-design/components/spinner"

// App components:
import TimeSeriesHistograms from '../charts/TimeSeriesHistogram.jsx'

// Contexts:
import TimeSeriesContext from '../contexts/TimeSeriesContext.jsx'
import SensorOverviewContext from '../contexts/SensorOverviewContext.jsx'

function UnivariateTimeSeriesChart({ sensorName }) {
    const { data } = useContext(TimeSeriesContext)
    const { zoomStart, zoomEnd, currentBrushes, selectedRanges } = useContext(SensorOverviewContext)
    const { setCurrentBrushes, setSelectedRanges } = useContext(SensorOverviewContext)
    const eChartRef = useRef(null)

    if (data) {
        let tagsList = [...data.tagsList]
        tagsList = cleanList(['asset', 'sampling_rate', 'timestamp', 'unix_timestamp'], tagsList)

        // Building the chart options:
        const chartOptions = buildChartOptions(
            data.timeseries.Items, 
            sensorName, 
            zoomStart.current, 
            zoomEnd.current
        )

        // ------------------------------------------
        // This event is triggered when the user 
        // finishes to brush a selection on the plot:
        // ------------------------------------------
        const onBrushEndEvent = (e) => {
            let currentRanges = []
            e["areas"].forEach((area) => {
                currentRanges.push({
                    "start": area.coordRange[0],
                    "end": area.coordRange[1]
                })
            })

            setSelectedRanges(currentRanges)
            setCurrentBrushes(currentRanges)
        }

        // -------------------------------------------------
        // Event triggered when the user modifies the zoom 
        // level using the slider at the bottom of the plot:
        // -------------------------------------------------
        const onDataZoomEnd = (e) => {
            if (e['type'] && e['type'] == 'datazoom') {
                zoomStart.current = e['start']
                zoomEnd.current = e['end']
            }
        }

        // ----------------------------------------------------------
        // Called once, when the chart is fully loaded: we dispatch 
        // an action manually to show the brush previously selection:
        // ----------------------------------------------------------
        const onChartReady = (e) => {
            if (eChartRef && eChartRef.current) {
                if (currentBrushes.length > 0) {
                    eChartRef.current.getEchartsInstance().dispatchAction({
                        type: 'brush',
                        areas: [
                            {
                                brushType: 'lineX',
                                coordRange: [currentBrushes[0]['start'], currentBrushes[0]['end']],
                                xAxisIndex: 0
                            }
                        ]
                    })
                }
            }
        }

        // ---------------------
        // Render the component:
        // ---------------------
        return (
            <SpaceBetween size="xxl" direction="horizontal">
                <Box>
                    <ReactEcharts 
                        option={chartOptions}
                        theme="macarons"
                        style={{height: 300, width: 750}}
                        onChartReady={onChartReady}
                        ref={eChartRef}
                        onEvents={{
                            'brushEnd': onBrushEndEvent, 
                            'datazoom': onDataZoomEnd,
                        }}
                    />
                </Box>
                <Box>
                    <TimeSeriesHistograms
                        data={data}
                        ranges={selectedRanges} 
                        sensorName={sensorName}
                        hideAnimation={true}
                        colors={['rgb(141, 152, 179, 0.5)', 'rgb(151, 181, 82, 0.7)']}
                    />
                </Box>
            </SpaceBetween>
        )
    }

    // While nothing is ready to render, we show a spinner:
    else {
        return (
            <Spinner />
        )
    }
}

export default UnivariateTimeSeriesChart