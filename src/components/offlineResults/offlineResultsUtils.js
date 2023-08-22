import { buildTimeseries, getEvaluationStartIndex, getZoomStart } from '../../utils/timeseries.js'
import { sortDictionnary, getLegendWidth } from '../../utils/utils.js'

// ---------------------------------------------------
// Prepare the evaluation results from a trained model
// ---------------------------------------------------
export function getModelEvaluationData(dailyAggregation, anomalies, modelDetails) {
    // Prepare daily aggregation data:
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
            const start = label['start']
            const end = label['end']

            x_labels.map((element, index) => {
                if (element >= start && element <= end) { y_labels[index] = 0.5 }
            })
        })
    }

    return {
        x_daily, 
        y_daily, 
        x_anomalies, 
        y_anomalies, 
        y_labels
    }
}

export function getSensorContribution(tagsList, sensorContribution) {
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

    return {
        sensorContributions,
        totalContribution,
        x_sensorContribution
    }
}

export function buildChartSeries(timeseries, tagsList, y_anomalies, y_daily) {
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

    // Configure the series to be plotted with echart:
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

    return {
        x_signals, 
        signals,
        series
    }
}

export function buildLabelSeries(y_labels) {
    return {
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
    }
}

export function buildSensorContributionSeries(sortedKeys, sensorContributions) {
    let sensorContributionSeries = []
    sortedKeys.forEach((tag) => {
        if (tag !== 'model' && tag !== 'timestamp') {
            sensorContributionSeries.push({
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

    return sensorContributionSeries
}

export function buildSignalSeries(sortedKeys, evaluationStartIndex, signals) {
    let markAreaSet = false
    let markArea = {}
    let signalYMin = 0.0
    let signalYMax = 0.0
    let yMin = undefined
    let yMax = undefined
    let signalSeries = []

    sortedKeys.forEach((tag) => {
        if (tag !== 'model' && tag !== 'timestamp') {
            // We only set up a markLine for the first time series plot:
            markArea = {}
            if (!markAreaSet) {
                markAreaSet = true

                markArea = {
                    itemStyle: { color: 'rgb(151, 181, 82, 0.1)' },
                    data: [[
                        { name: 'Training range', xAxis: 0 },
                        { xAxis: evaluationStartIndex }
                    ]]
                }
            }

            signalSeries.push({
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

    return {
        signalSeries,
        yMin,
        yMax
    }
}

export function buildOffConditionSeries(modelDetails, signals, yMin, yMax, sortedKeys) {
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

    return {
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
    }
}

// -----------------------------------------------------------------------
// Builds the eChart options variable to plot the detected events overview
// -----------------------------------------------------------------------
export function buildChartOptions(
    tagsList,
    sensorContribution,
    timeseries,
    evaluationStart,
    modelDetails,
    dailyAggregation,
    anomalies,
    showTopN
) {
    const zoomStart = parseInt(getZoomStart(dailyAggregation.Items, evaluationStart) * 0.9)

    const { 
        x_daily, 
        y_daily, 
        x_anomalies, 
        y_anomalies, 
        y_labels 
    } = getModelEvaluationData(dailyAggregation, anomalies, modelDetails)

    // Prepare sensor contribution data:
    let {
        sensorContributions,
        totalContribution,
        x_sensorContribution
    } = getSensorContribution(tagsList, sensorContribution)
    let sortedKeys = sortDictionnary(totalContribution, false)
    const legendWidth = getLegendWidth(tagsList)

    // Prepare the series to be plotted:
    let eventTitle = 'Detected events'
    let { x_signals, signals, series } = buildChartSeries(timeseries, tagsList, y_anomalies, y_daily)
    const evaluationStartIndex = getEvaluationStartIndex(timeseries.Items, evaluationStart)

    // Adding a series for labels if they were configured for this model:
    if (modelDetails['labels']) {
        series.push(buildLabelSeries(y_labels))
        eventTitle = 'Detected events (red) and known labels (green)'
    }

    // Configuring the series for the sensor contribution data:
    series = [...series, ...buildSensorContributionSeries(sortedKeys, sensorContributions)]

    // Configuring the series for the raw time series data:
    const { signalSeries, yMin, yMax } = buildSignalSeries(sortedKeys, evaluationStartIndex, signals)
    series = [...series, ...signalSeries]

    // Add an off condition signal to the time series plot if this feature was used:
    if (modelDetails['offCondition']) {
        series.push(buildOffConditionSeries(modelDetails, signals, yMin, yMax, sortedKeys))

        sortedKeys = [{
            name: 'Off condition', 
            icon: 'circle', 
            itemStyle: {
                color: 'rgb(192, 80, 80, 0.2)', 
                borderColor: 'rgb(192, 80, 80)', 
                borderWidth: 1.0
            }
        }, ...sortedKeys]

        if (showTopN) { showTopN += 1 }
    }

    let option = {
        title: [
            { top: 0, left: 50, text: eventTitle, textStyle: { fontSize: 16, color: '#000' } },
            { top: 140, left: 50, text: 'Detected events (aggregated by day)', textStyle: { fontSize: 16, color: '#000' } },
            { top: 370, left: 50, text: 'Sensor contribution evolution', textStyle: { fontSize: 16, color: '#000' } },
            { top: 600, left: 50, text: 'Sensor time series', textStyle: { fontSize: 16, color: '#000' } }
        ],
        grid: [
            { left: 50, right: legendWidth, top: 30, height: 30, tooltip: { show: true } },
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

    // If we only wants to show the top N sensors:
    if (showTopN) {
        option['legend']['selected'] = {}
        sortedKeys.forEach((tag, index) => {
            if (index < showTopN) {
                option['legend']['selected'][tag] = true
            }
            else {
                option['legend']['selected'][tag] = false
            }
        })
    }

    return option
}