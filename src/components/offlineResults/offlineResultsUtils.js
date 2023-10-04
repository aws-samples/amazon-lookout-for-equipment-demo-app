import { buildTimeseries2 } from '../../utils/timeseries.js'
import { sortDictionnary, getLegendWidth, cleanList } from '../../utils/utils.js'

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
    const legendWidth = getLegendWidth(tagsList)

    // Computes min and max of xAxis:
    const xMin = new Date(anomalies[0].timestamp.N * 1000)
    const xMax = new Date(anomalies[anomalies.length - 1].timestamp.N * 1000)

    // Prepare anomalies data:
    let eventTitle = 'Detected events'
    const anomaliesSeries = buildAnomaliesSeries(anomalies)
    let series = [anomaliesSeries, getTrainingMarkAreaSeries(0, evaluationStart)]

    // Adding a series for labels if they were configured for this model:
    if (modelDetails['labels']) {
        series.push(buildLabelSeries(modelDetails))
        eventTitle = 'Detected events (red) and known labels (green)'
    }

    // Prepare daily aggregation data:
    series = [...series, buildDailyAggregationSeries(dailyAggregation), getTrainingMarkAreaSeries(1, evaluationStart)]

    // Prepare sensor contribution data:
    let { sensorContributionSeries, sortedTags } = buildSensorContributionSeries(sensorContribution, tagsList)
    series = [...series, ...sensorContributionSeries, getTrainingMarkAreaSeries(2, evaluationStart)]

    // Configuring the series for the raw time series data:
    const { signalSeries, yMin, yMax, unusedTags } = buildSignalSeries(timeseries, sortedTags)
    series = [...series, ...signalSeries, getTrainingMarkAreaSeries(3, evaluationStart)]
    if (unusedTags.length > 0) {
        sortedTags = [...sortedTags, ...unusedTags]
    }

    // Add an off condition signal to the time series plot 
    // if this feature was used to train this model:
    if (modelDetails['offCondition']) {
        const offTimeRanges = buildOffTimeRanges(signalSeries, modelDetails['offCondition'])
        for (let i=0; i<=3; i++) {
            series.push(getOfftimeMarkAreaSeries(i, offTimeRanges))
        }
    }

    let options = {
        title: [
            { top: 0, left: 50, text: eventTitle },
            { top: 150, left: 50, text: 'Detected events (aggregated by day)' },
            { top: 380, left: 50, text: 'Sensor contribution evolution (aggregated by day)' },
            { top: 610, left: 50, text: 'Sensor time series' }
        ],
        grid: [
            { left: 50, right: legendWidth, top: 45, height: 30, tooltip: { show: true } },
            { left: 50, right: legendWidth, top: 195, height: 150 },
            { left: 50, right: legendWidth, top: 425, height: 150 },
            { left: 50, right: legendWidth, top: 655, height: 150 }
        ],
        xAxis: [
            { type: 'time', gridIndex: 0, min: xMin, max: xMax, minorTick: { show: true } },
            { type: 'time', gridIndex: 1, min: xMin, max: xMax, minorTick: { show: true } },
            { type: 'time', gridIndex: 2, min: xMin, max: xMax, minorTick: { show: true } },
            { type: 'time', gridIndex: 3, min: xMin, max: xMax, minorTick: { show: true } },
        ],
        yAxis: [
            { show: false, gridIndex: 0, min: 0.0, max: 1.0 },
            { type: 'value', show: true, gridIndex: 1 },
            { type: 'value', show: true, gridIndex: 2, min: 0.0, max: 1.0 },
            { type: 'value', show: true, gridIndex: 3 /*, min: yMin.toFixed(0), max: yMax.toFixed(0) */},
        ],
        series: series,
        animation: false,
        dataZoom: [{ type:'slider', start: /* zoomStart */ 0, end: 100, xAxisIndex: [0, 1, 2, 3], top: 100, height: 30 }],
        legend: [
            // Signal time series legend, located on the bottom. Command
            // both the signal time series and the signal contribution:
            {
                type: 'scroll',
                right: 10,
                top: 370,
                selector: [
                    { type: 'all', title: 'All' },
                    { type: 'inverse', title: 'Inverse' }
                ],
                data: sortedTags
            },

            // Top legend positioned next to the detected events:
            {
                right: 10,
                top: 0,
                data: [
                    {
                        name: 'Training range',
                        itemStyle: {
                            color: 'rgb(151, 181, 82, 0.15)', 
                            borderColor: 'rgb(151, 181, 82, 0.8)', 
                            borderWidth: 1.0,
                            borderType: 'dashed'
                        }
                    },
                    {
                        name: 'Off condition',
                        itemStyle: {
                            color: 'rgb(192, 80, 80, 0.2)', 
                            borderColor: 'rgb(192, 80, 80)', 
                            borderWidth: 1.0
                        }
                    }, 
                    'Detected events', 
                    'Labels', 
                    'Detected events (daily)'
                ]
            }
        ],
        tooltip: { show: true, trigger: 'axis' }
    }

    // If we only wants to show the top N sensors:
    if (showTopN) {
        options['legend'][0]['selected'] = {}
        sortedTags.forEach((tag, index) => {
            if (index < showTopN) {
                options['legend'][0]['selected'][tag] = true
            }
            else {
                options['legend'][0]['selected'][tag] = false
            }
        })
    }

    return options
}

// ---------------------------------------------------------------------
// Build a fake signal to help visualize the training / evaluation range
// ---------------------------------------------------------------------
function getTrainingMarkAreaSeries(axis, evaluationStart) {
    const markAreaSeries = {
        name: 'Training range',
        symbol: 'none',
        data: [],
        type: 'line',
        color: 'rgb(151, 181, 82, 0.2)',
        xAxisIndex: axis,
        yAxisIndex: axis,
        markArea: {
            itemStyle: { 
                color: 'rgb(151, 181, 82, 0.15)',
                borderColor: 'rgb(151, 181, 82, 0.8)',
                borderWidth: 1.0,
                borderType: 'dashed'
            },
            data: [[
                { name: 'Training range', xAxis: 0 },
                { xAxis: evaluationStart }
            ]]
        },
    }

    return markAreaSeries
}

// ------------------------------------------------------------
// Checks if a given value is part of the off time range or not
// ------------------------------------------------------------
function offtime(valueToCheck, offConditionCriteria, offConditionValue) {
    if (offConditionCriteria === "<") {
        if (valueToCheck <= offConditionValue) {
            return true
        }
    }
    else {
        if (valueToCheck >= offConditionValue) {
            return true
        }
    }

    return false
}

// ---------------------------------------------------------------------------
// Builds the off time ranges based on whether the off condition is met or not
// ---------------------------------------------------------------------------
function buildOffTimeRanges(series, offConditionDefinition) {
    // Get off condition parameters:
    const offConditionSignal = offConditionDefinition['signal']
    const offConditionCriteria = offConditionDefinition['criteria']
    const offConditionValue = offConditionDefinition['conditionValue']

    // Get the signal used for defining the off time periods:
    let offConditionTimeseries = undefined
    series.forEach((serie) => {
        if (serie.name === offConditionSignal) {
            offConditionTimeseries = serie.data
        }
    })

    // Buils the offtime condition data:
    let isOff = false
    let previousIsOff = false
    let offCoord = []
    let xStart = undefined
    let xEnd = undefined
    offConditionTimeseries.forEach((item) => {
        const x = item[0]
        const y = item[1]

        isOff = offtime(y, offConditionCriteria, offConditionValue)
        if (isOff && isOff !== previousIsOff) {
            xStart = x
            xEnd = undefined
        }
        else if (!isOff && isOff !== previousIsOff) {
            xEnd = x
            offCoord.push([{xAxis: xStart}, {xAxis: xEnd}])
        }

        previousIsOff = isOff
    })

    if (xStart && !xEnd) {
        xEnd = offConditionTimeseries[offConditionTimeseries.length - 1][0]
        offCoord.push([{xAxis: xStart}, {xAxis: xEnd}])
    }

    return offCoord
}

// -----------------------------------------------------------
// Builds the eChart series for the off time condition: this
// will be displayed as an additional signal in all the charts
// -----------------------------------------------------------
function getOfftimeMarkAreaSeries(axis, offTimeRanges) {
    const markAreaSeries = {
        name: 'Off condition',
        symbol: 'none',
        data: [],
        type: 'line',
        color: 'rgb(192, 80, 80, 0.1)',
        xAxisIndex: axis,
        yAxisIndex: axis,
        markArea: {
            itemStyle: { color: 'rgb(192, 80, 80, 0.1)' },
            data: offTimeRanges,
            lineStyle: { width: 0 },
        },
    }

    return markAreaSeries
}

// --------------------------------------------------
// Build the eChart series for the detected anomalies
// --------------------------------------------------
function buildAnomaliesSeries(anomalies) {
    const results = buildTimeseries2(anomalies, 'anomaly', 'S')

    const series = {
        name: 'Detected events',
        symbol: 'none',
        data: results['data'],
        type: 'line',
        color: "#d87a80",
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
    }

    return series
}

// -------------------------------------
// Build the eChart series for the daily
// aggregate of the detected anomalies
// -------------------------------------
function buildDailyAggregationSeries(dailyAggregation) {
    const results = buildTimeseries2(dailyAggregation, 'anomaly', 'S')

    const series = {
        name: 'Detected events (daily)',
        symbol: 'none',
        data: results['data'],
        type: 'bar',
        yAxisIndex: 1,
        xAxisIndex: 1,
        itemStyle: {
            color: "#2ec7c9",
            shadowColor: 'rgba(0, 0, 0, 0.2)',
            shadowBlur: 5
        },
    }

    return series
}

// ------------------------------------------------------
// Builds the eChart series for the sensors contributions
// ------------------------------------------------------
function buildSensorContributionSeries(sensorContribution, tagsList) {
    let data = {}
    let totalContribution = {}
    let sensorContributionSeries = []

    tagsList.forEach((tag) => {
        const results = buildTimeseries2(sensorContribution, tag, 'S')
        data[tag] = results['data']
        totalContribution[tag] = results['sum']
    })

    const sortedTags = sortDictionnary(totalContribution, false)

    sortedTags.forEach((tag, index) => {
        sensorContributionSeries.push({
            symbol: 'none',
            data: data[tag],
            type: 'line',
            xAxisIndex: 2,
            yAxisIndex: 2,
            stack: 'Total',
            step: true,
            areaStyle: { opacity: 0.5 },
            lineStyle: { width: 1.0 },
            emphasis: { focus: 'series' },
            name: tag,
            tooltip: { valueFormatter: (value) => (value*100).toFixed(0) + '%' }
        })
    })

    return { sensorContributionSeries, sortedTags }
}

// ---------------------------------------------------
// Assembles the eChart series for the raw time series
// ---------------------------------------------------
function buildSignalSeries(timeseries, sortedTags) {
    let signalSeries = []
    let overallYMin = undefined
    let overallYMax = undefined

    let unusedTags = Object.keys(timeseries[0])
    const tagsToRemove = ['asset', 'sampling_rate', 'timestamp', 'unix_timestamp', ...sortedTags]
    unusedTags = cleanList(tagsToRemove, unusedTags)

    sortedTags.forEach((tag) => {
        const results = buildTimeseries2(timeseries, tag, 'S', 'unix_timestamp')

        signalSeries.push({
            name: tag,
            symbol: 'none',
            sampling: 'lttb',
            data: results['data'],
            type: 'line',
            emphasis: { focus: "series" },
            xAxisIndex: 3,
            yAxisIndex: 3,
            tooltip: { valueFormatter: (value) => value.toFixed(2) },
            lineStyle: { width: 2.0 }
        })

        if (!overallYMin) { overallYMin = results['yMin'] }
        if (!overallYMax) { overallYMax = results['yMax'] }
        if (results['yMin'] < overallYMin) { overallYMin = results['yMin'] }
        if (results['yMax'] > overallYMax) { overallYMax = results['yMax'] }
    })

    unusedTags.forEach((tag, index) => {
        const results = buildTimeseries2(timeseries, tag, 'S', 'unix_timestamp')
        unusedTags[index] = `(${tag})`

        signalSeries.push({
            name: `(${tag})`,
            symbol: 'none',
            sampling: 'lttb',
            data: results['data'],
            type: 'line',
            emphasis: { focus: "series" },
            xAxisIndex: 3,
            yAxisIndex: 3,
            tooltip: { valueFormatter: (value) => value.toFixed(2) },
            lineStyle: { width: 2.0 }
        })

        if (!overallYMin) { overallYMin = results['yMin'] }
        if (!overallYMax) { overallYMax = results['yMax'] }
        if (results['yMin'] < overallYMin) { overallYMin = results['yMin'] }
        if (results['yMax'] > overallYMax) { overallYMax = results['yMax'] }
    })

    return { 
        signalSeries: signalSeries,
        yMin: overallYMin,
        yMax: overallYMax,
        unusedTags: unusedTags
    }
}

// --------------------------------------
// Build the eChart series for the labels
// --------------------------------------
function buildLabelSeries(modelDetails) {
    const possibleSamplingRate = {
        '1 second': 1, 
        '5 seconds': 5,
        '10 seconds': 10,
        '15 seconds': 15,
        '30 seconds': 30,
        '1 minute': 60,
        '5 minutes': 300,
        '10 minutes': 600,
        '15 minutes': 900,
        '30 minutes': 1800,
        '1 hour': 3600
    }
    const startTime = new Date(modelDetails['trainingStart'])
    const samplingRate = possibleSamplingRate[modelDetails['samplingRate']] * 1000
    let labelData = []

    labelData.push([startTime, 0.0])
    modelDetails['labels'].forEach((label) => {
        labelData.push([new Date(label.start.getTime() - samplingRate), 0.0])
        labelData.push([label.start, 0.5])
        labelData.push([label.end, 0.5])
        labelData.push([new Date(label.end.getTime() + samplingRate), 0.0])
    })

    return {
        name: 'Labels',
        symbol: 'none',
        sampling: 'none',
        data: labelData,
        type: 'line',
        color: "#97b552",
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