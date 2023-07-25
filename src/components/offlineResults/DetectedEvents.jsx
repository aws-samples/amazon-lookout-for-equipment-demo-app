// Imports:
import { useRef } from 'react'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"

// CloudScape Components:
import Header from "@cloudscape-design/components/header"
import Container from "@cloudscape-design/components/container"

// Utils:
import { buildTimeseries, getZoomStart, getEvaluationStartIndex } from '../../utils/timeseries.js'
import { sortDictionnary, getLegendWidth } from '../../utils/utils.js'

function DetectedEvents({ modelDetails }) {
    if (modelDetails && modelDetails['status'] === 'SUCCESS') {
        const dailyAggregation   = modelDetails['dailyAggregation']
        const anomalies          = modelDetails['anomalies']
        const sensorContribution = modelDetails['sensorContribution']
        const tagsList           = modelDetails['tagsList']
        const timeseries         = modelDetails['timeseries']
        const evaluationStart    = new Date(modelDetails['evaluationStart'])
        const option             = useRef(undefined)

        // Prepare daily aggregation data:
        const zoomStart = parseInt(getZoomStart(dailyAggregation.Items, evaluationStart) * 0.9)
        let results = buildTimeseries(dailyAggregation.Items, 'anomaly')
        const x_daily = results['x']
        const y_daily = results['y']

        // Prepare anomalies data:
        results = buildTimeseries(anomalies.Items, 'anomaly')
        const x_anomalies = results['x']
        const y_anomalies = results['y']

        // Prepare label data when provided with the model:
        let y_labels = []
        if (modelDetails['labels']) {
            const x_labels = x_anomalies.map((element) => new Date(element.replace('\n', 'T') + 'Z').getTime())
            y_labels = Array.apply(0.0, Array(y_anomalies.length)).map(() => 0.0)

            modelDetails['labels'].forEach((label) => {
                const start = label['start'] * 1000
                const end = label['end'] * 1000

                x_labels.map((element, index) => {
                    (element >= start && element <= end) ? y_labels[index] = 0.5 : y_labels[index] = 0.0
                })
            })
        }

        // Prepare sensor contribution data:
        if (!sensorContribution) {
            return (
                <Container header={<Header variant="h1">Detected events</Header>}>
                    No event detected by this model
                </Container>
            )
        }
        else {
            let sensorContributions = {}
            let totalContribution = {}
            let x_sensorContribution = undefined

            tagsList.forEach((tag) => {
                if (tag !== 'model' && tag !== 'timestamp') {
                    const currentSensorContribution = buildTimeseries(sensorContribution.Items, tag)
                    sensorContributions[tag] = currentSensorContribution

                    if (!totalContribution[tag]) { totalContribution[tag] = 0 }
                    totalContribution[tag] += currentSensorContribution['sum']

                    if (!x_sensorContribution) {
                        x_sensorContribution = currentSensorContribution['x']
                    }
                }
            })
            let sortedKeys = sortDictionnary(totalContribution, false)
            const legendWidth = getLegendWidth(tagsList)

            // Prepare the raw time series data:
            let x_signals = []
            let signals = {}
            timeseries.Items.forEach((item) => {
                let current_date = new Date(item['timestamp']['S']).getTime()
                current_date = current_date - new Date().getTimezoneOffset()*30*1000
                current_date = new Date(current_date).toISOString().substring(0, 19).replace('T', '\n');
                x_signals.push(current_date)
                
                tagsList.forEach((tag) => {
                    if (tag !== 'model' && tag !== 'timestamp') {
                        if (!signals[tag]) { signals[tag] = [] }
                        signals[tag].push(parseFloat(item[tag]['S']))
                    }
                })
            })
            const evaluationStartIndex = getEvaluationStartIndex(timeseries.Items, evaluationStart)

            // Configure the series to be plotted with echart:
            let eventTitle = 'Detected events'
            let series = [
                // Anomalies:
                {
                    symbol: 'none',
                    data: y_anomalies,
                    type: 'line',
                    lineStyle: {
                        color: "#d87a80",
                        opacity: 1.0,
                        shadowColor: 'rgba(0, 0, 0, 0.2)',
                        shadowBlur: 5,
                        width: 0.5
                    },
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    areaStyle: {
                        color: '#d87a80',
                        opacity: 0.2
                    }
                },

                // Daily aggregation:
                {
                    symbol: 'none',
                    data: y_daily,
                    type: 'bar',
                    yAxisIndex: 1,
                    xAxisIndex: 1,
                    itemStyle: {
                        color: "#2ec7c9",
                        shadowColor: 'rgba(0, 0, 0, 0.2)',
                        shadowBlur: 5
                    },
                }
            ]

            // Labels:
            if (modelDetails['labels']) {
                series.push({
                    symbol: 'none',
                    data: y_labels,
                    type: 'line',
                    lineStyle: {
                        color: "#97b552",
                        opacity: 1.0,
                        shadowColor: 'rgba(0, 0, 0, 0.2)',
                        shadowBlur: 5,
                        width: 0.5
                    },
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    areaStyle: {
                        color: '#97b552',
                        opacity: 0.2
                    }
                })

                eventTitle = 'Detected events (red) and known labels (green)'
            }

            // Configuring the series for the sensor contribution data:
            sortedKeys.forEach((tag) => {
                if (tag !== 'model' && tag !== 'timestamp') {
                    series.push({
                        symbol: 'none',
                        data: sensorContributions[tag]['y'],
                        type: 'line',
                        xAxisIndex: 2,
                        yAxisIndex: 2,
                        stack: 'Total',
                        areaStyle: { opacity: 0.5 },
                        lineStyle: { width: 1.0 },
                        emphasis: { focus: 'series' },
                        name: tag,
                        tooltip: { valueFormatter: (value) => (value*100).toFixed(0) + '%' }
                    })
                }
            })

            // Configuring the series for the raw time series data:
            let markLineSet = false
            let markArea = {}
            let signalYMin = 0.0
            let signalYMax = 0.0
            let yMin = undefined
            let yMax = undefined
            sortedKeys.forEach((tag) => {
                if (tag !== 'model' && tag !== 'timestamp') {
                    // We only set up a markLine for the first time series plot:
                    markArea = {}
                    if (!markLineSet) {
                        markLineSet = true

                        markArea = {
                            itemStyle: { color: 'rgb(151, 181, 82, 0.1)' },
                            data: [
                                [
                                    {
                                        name: 'Training range',
                                        xAxis: 0
                                    },
                                    {
                                        xAxis: evaluationStartIndex
                                    }
                                ],
                            ]
                        }
                    }

                    series.push({
                        name: tag,
                        symbol: 'none',
                        sampling: 'lttb',
                        data: signals[tag],
                        type: 'line',
                        emphasis: { focus: "series" },
                        xAxisIndex: 3,
                        yAxisIndex: 3,
                        markArea: markArea,
                        tooltip: { valueFormatter: (value) => value.toFixed(2) },
                        lineStyle: { width: 2.0 }
                    })

                    signalYMin = Math.min(...signals[tag])
                    signalYMax = Math.max(...signals[tag])
                    if (!yMin || signalYMin < yMin) { yMin = signalYMin }
                    if (!yMax || signalYMax > yMax) { yMax = signalYMax }
                }
            })

            // Add an off condition signal to the time series plot if this feature was used:
            if (modelDetails['offCondition']) {
                const offConditionSignal = modelDetails['offCondition']['signal']
                const offConditionCriteria = modelDetails['offCondition']['criteria']
                const offConditionValue = modelDetails['offCondition']['conditionValue']
                const offConditionSignalY = signals[offConditionSignal]

                let offConditionY = Array.apply(yMin, Array(signals[sortedKeys[0]].length)).map(() => yMin)
                let indexes = []
                if (offConditionCriteria === ">") {
                    indexes = offConditionSignalY.map((element,index) => element >= offConditionValue ? index : undefined).filter(x => x)
                }
                else {
                    indexes = offConditionSignalY.map((element,index) => element <= offConditionValue ? index : undefined).filter(x => x)
                }
                indexes.map((element) => { offConditionY[element] = yMax * 1.21 })

                series.push({
                    name: "Off condition",
                    symbol: 'none',
                    sampling: 'lttb',
                    data: offConditionY,
                    type: 'line',
                    emphasis: { disabled: true },
                    xAxisIndex: 3,
                    yAxisIndex: 3,
                    lineStyle: { width: 0, color: 'rgb(192, 80, 80)' },
                    areaStyle: {
                        opacity: 0.1,
                        color: 'rgb(192, 80, 80)'
                    }
                })

                sortedKeys = [{
                    name: 'Off condition', 
                    icon: 'circle', 
                    itemStyle: {
                        color: 'rgb(192, 80, 80, 0.2)', 
                        borderColor: 'rgb(192, 80, 80)', 
                        borderWidth: 1.0
                    }
                }, ...sortedKeys]
            }

            // Chart options:
            option.current = {
                title: [
                    { top: 0, left: 50, text: eventTitle, textStyle: { fontSize: 16, color: '#000' } },
                    { top: 140, left: 50, text: 'Detected events (aggregated by day)', textStyle: { fontSize: 16, color: '#000' } },
                    { top: 370, left: 50, text: 'Sensor contribution evolution', textStyle: { fontSize: 16, color: '#000' } },
                    { top: 600, left: 50, text: 'Sensor time series', textStyle: { fontSize: 16, color: '#000' } }
                ],
                grid: [
                    { left: 50, right: legendWidth, top: 30, height: 30, tooltip: { show: false } },
                    { left: 50, right: legendWidth, top: 180, height: 150 },
                    { left: 50, right: legendWidth, top: 410, height: 150 },
                    { left: 50, right: legendWidth, top: 650, height: 150 }
                ],
                xAxis: [
                    { type: 'category', data: x_anomalies, gridIndex: 0, show: false },
                    { type: 'category', data: x_daily, gridIndex: 1 },
                    { type: 'category', data: x_sensorContribution, gridIndex: 2 },
                    { type: 'category', data: x_signals, gridIndex: 3 },
                ],
                yAxis: [
                    { show: false, gridIndex: 0 },
                    { type: 'value', show: true, gridIndex: 1 },
                    { type: 'value', show: true, gridIndex: 2, min: 0.0, max: 1.0 },
                    { type: 'value', show: true, gridIndex: 3 }
                ],
                series: series,
                animation: false,
                dataZoom: [{ type:'slider', start: zoomStart, end: 100, xAxisIndex: [0, 1, 2, 3], top: 85, height: 30 }],
                legend: {
                    type: 'scroll',
                    orient: 'vertical',
                    textStyle: { fontSize: 10 },
                    icon: "circle",
                    right: 40,
                    top: 40,
                    selector: [
                        { type: 'all', title: 'All' },
                        { type: 'inverse', title: 'Inverse' }
                    ],
                    data: sortedKeys
                },
                tooltip: {
                    show: true,
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross',
                        label: {
                            backgroundColor: '#6a7985'
                        }
                    }
                }
            }

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
    }
}

export default DetectedEvents