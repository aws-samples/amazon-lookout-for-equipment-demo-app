import { cleanList, getLegendWidth, sortDictionnary } from '../../utils/utils'
import { getSchedulerInfo, getAllTimeseriesWindow } from '../../utils/dataExtraction'
import { buildTimeseries2 } from '../../utils/timeseries.js'
import { histogram } from 'echarts-stat'
import awsmobile from '../../aws-exports'

// **************************************************************************************
// THE FOLLOWING FUNCTIONS ARE USED TO EXTRACT ALL THE
// NECESSARY DATA TO DISPLAY THE DETECTED EVENTS RESULTS 
// **************************************************************************************

// --------------------------------------------------------------------
// This function extracts the live results coming from a deployed model
// --------------------------------------------------------------------
export async function getLiveResults(gateway, uid, projectName, modelName, startTime, endTime) {
    const modelDetails = await getModelDetails(gateway, modelName)
    const anomalies = await getAnomalies(gateway, uid, projectName, modelName, startTime, endTime)
    const rawAnomalies = await getRawAnomalies(gateway, uid, projectName, modelName, startTime, endTime)
    const sensorContribution = await getSensorContribution(gateway, uid, projectName, modelName, startTime, endTime)

    const timeseries = await getAllTimeseriesWindow(
        gateway,
        uid + '-' + projectName,
        startTime,
        endTime,
        "raw"
    )

    const tagsToRemove = ['asset', 'sampling_rate', 'timestamp', 'unix_timestamp']
    let tagsList = timeseries['tagsList']
    tagsList = cleanList(tagsToRemove, tagsList)

    return {
        modelDetails: modelDetails,
        timeseries: timeseries['timeseries'],
        sensorContribution: sensorContribution,
        tagsList: tagsList,
        anomalies: anomalies,
        rawAnomalies: rawAnomalies
    }
}

// ----------------------------------------------
// Get some key parameters from the current model
// ----------------------------------------------
async function getModelDetails(gateway, modelName) {
    const possibleSamplingRate = {
        'PT1S': 1, 
        'PT5S': 5,
        'PT10S': 10,
        'PT15S': 15,
        'PT30S': 30,
        'PT1M': 60,
        'PT5M': 300,
        'PT10M': 600,
        'PT15M': 900,
        'PT30M': 1800,
        'PT1H': 3600
    }

    const modelResponse = await gateway.lookoutEquipment.describeModel(modelName)

    let response = {
        status: modelResponse['Status'],
        samplingRate: possibleSamplingRate[modelResponse['DataPreProcessingConfiguration']['TargetSamplingRate']]
    }

    return response
}

// ------------------------------------------------
// This function gets the anomalous events detected
// by a given model between a range of time
// ------------------------------------------------
async function getAnomalies(gateway, uid, projectName, modelName, startTime, endTime) {
    const anomaliesQuery = { 
        TableName: `l4edemoapp-${uid}-${projectName}-anomalies`,
        KeyConditionExpression: "#model = :model AND #timestamp BETWEEN :startTime AND :endTime",
        ExpressionAttributeNames: {
            "#model": "model",
            "#timestamp": "timestamp"
        },
        ExpressionAttributeValues: {
             ":model": {"S": modelName},
             ":startTime": {"N": startTime.toString() },
             ":endTime": {"N": endTime.toString() }
        }
    }

    let anomalies = await gateway
        .dynamoDb.queryAll(anomaliesQuery)
        .catch((error) => console.log(error.response))

    if (anomalies.Items.length > 0) { return anomalies.Items }

    return undefined
}

// ------------------------------------------------
// This function gets the raw anomaly scores output
// by a given model between a range of time
// ------------------------------------------------
async function getRawAnomalies(gateway, uid, projectName, modelName, startTime, endTime) {
    const rawAnomaliesQuery = { 
        TableName: `l4edemoapp-${uid}-${projectName}-raw-anomalies`,
        KeyConditionExpression: "#model = :model AND #timestamp BETWEEN :startTime AND :endTime",
        ExpressionAttributeNames: {
            "#model": "model",
            "#timestamp": "timestamp"
        },
        ExpressionAttributeValues: {
             ":model": {"S": modelName},
             ":startTime": {"N": startTime.toString() },
             ":endTime": {"N": endTime.toString() }
        }
    }

    let anomalies = await gateway
        .dynamoDb.queryAll(rawAnomaliesQuery)
        .catch((error) => console.log(error.response))

    if (anomalies.Items.length > 0) { return anomalies.Items }

    return undefined
}

// -------------------------------------------
// This function gets the sensor contributions 
// given by a model between a range of time
// -------------------------------------------
async function getSensorContribution(gateway, uid, projectName, modelName, startTime, endTime) {
    const sensorContributionQuery = { 
        TableName: `l4edemoapp-${uid}-${projectName}-sensor_contribution`,
        KeyConditionExpression: "#model = :model AND #timestamp BETWEEN :startTime AND :endTime",
        ExpressionAttributeNames: {
            "#model": "model",
            "#timestamp": "timestamp"
        },
        ExpressionAttributeValues: {
             ":model": {"S": modelName},
             ":startTime": {"N": startTime.toString() },
             ":endTime": {"N": endTime.toString() }
        }
    }

    let sensorContribution = await gateway
        .dynamoDb.queryAll(sensorContributionQuery)
        .catch((error) => console.log(error.response))

    // If the payload is too large (> 1 MB), the API will paginate
    // the output. Let's collect all the data we need to cover the 
    // range requested by the user:
    if (sensorContribution.Items.length > 0) {
        return sensorContribution.Items
    }
    
    return undefined
}

// ------------------------------------------------
// This function gets the anomalous events detected
// by a given model between a range of time
// ------------------------------------------------
export async function getAssetCondition(gateway, asset, startTime, endTime, projectName) {
    const anomaliesQuery = { 
        TableName: `l4edemoapp-${projectName}-anomalies`,
        KeyConditionExpression: "#model = :model AND #timestamp BETWEEN :startTime AND :endTime",
        ExpressionAttributeNames: {
            "#model": "model",
            "#timestamp": "timestamp"
        },
        ExpressionAttributeValues: {
             ":model": {"S": asset},
             ":startTime": {"N": startTime.toString() },
             ":endTime": {"N": endTime.toString() }
        }
    }

    let anomalies = await gateway
        .dynamoDb.queryAll(anomaliesQuery)
        .catch((error) => console.log(error.response))

    if (anomalies.Items.length > 0) {
        let condition = { '0': 0.0, '1': 0.0 }
        let totalTime = 0.0
        anomalies.Items.forEach((item, index) => {
            if (index > 0) {
                const previousTimestamp = parseFloat(anomalies.Items[index - 1]['timestamp']['N'])
                const currentTimestamp = parseFloat(item['timestamp']['N'])
                const duration = currentTimestamp - previousTimestamp

                condition[item['anomaly']['N']] += duration
                totalTime += duration
            }
            
        })

        return {
            totalTime: totalTime,
            condition: condition, 
            anomalies: anomalies
        }
    }

    return undefined
}

// **************************************************************************************
// THE FOLLOWING FUNCTIONS ARE USED TO BUILD THE eCHART 
// CONFIGURATION OBJECTS FOR THE DIFFERENT PLOTS
// **************************************************************************************

// ----------------------------------------------------------------
// Builds the option object to build the live detected event charts
// ----------------------------------------------------------------
export function buildLiveDetectedEventsOptions(tagsList, timeseries, sensorContribution, anomalies, rawAnomalies, samplingRate, startTime, endTime, showTopN) {
    let series = []
    const legendWidth = getLegendWidth(tagsList)
    const eventTitle = "Detected events"

    // Computes min and max of xAxis:
    const xMin = new Date(anomalies[0].timestamp.N * 1000)
    const xMax = new Date(anomalies[anomalies.length - 1].timestamp.N * 1000)

    // Prepare anomalies data:
    const anomaliesSeries = buildAnomaliesSeries(anomalies)
    series = [...anomaliesSeries]

    // Prepare raw anomalies data:
    const rawAnomaliesSeries = buildRawAnomaliesSeries(anomalies, rawAnomalies)
    series = [...series, ...rawAnomaliesSeries]

    // Prepare sensor contribution data:
    let { sortedKeys, sensorContributionSeries } = buildSensorContributionSeries(
        tagsList, 
        samplingRate, 
        anomalies[0].timestamp['N']*1000,
        anomalies[anomalies.length - 1].timestamp['N']*1000, 
        sensorContribution
    )
    series = [...series, ...sensorContributionSeries]

    // Configuring the series for the raw time series data:
    const signalSeries = buildSignalSeries(timeseries, tagsList)
    series = [...series, ...signalSeries]

    // Finally build the full configuration for all the plots to be displayed:
    let options = {
        title: [
            { top: 0, left: 0, text: eventTitle },
            { top: 170, left: 0, text: 'Raw anomaly score' },
            { top: 390, left: 0, text: 'Sensor contribution evolution' },
            { top: 690, left: 0, text: 'Sensor time series' },
        ],
        grid: [
            { left: 50, right: legendWidth, top: 30, height: 30 },
            { left: 50, right: legendWidth, top: 210, height: 120 },
            { left: 50, right: legendWidth, top: 430, height: 200 },
            { left: 50, right: legendWidth, top: 730, height: 200 },
        ],
        xAxis: [
            { type: 'time', gridIndex: 0, min: xMin, max: xMax, minorTick: { show: true } },
            { type: 'time', gridIndex: 1, min: xMin, max: xMax, minorTick: { show: true } },
            { type: 'time', gridIndex: 2, min: xMin, max: xMax, minorTick: { show: true } },
            { type: 'time', gridIndex: 3, min: xMin, max: xMax, minorTick: { show: true } }
        ],
        yAxis: [
            { show: false, gridIndex: 0, min: 0.0, max: 1.0 },
            { show: true, gridIndex: 1, min: 0.0, max: 1.0 },
            { show: true, gridIndex: 2, min: 0.0, max: 1.0 },
            { show: true, gridIndex: 3 },
        ],
        series: series,
        animation: false,
        dataZoom: [{ type:'slider', start: 0, end: 100, xAxisIndex: [0, 1, 2, 3], top: 110, height: 30 }],
        legend: {
            right: 10,
            top: 380,
            selector: [
                { type: 'all', title: 'All' },
                { type: 'inverse', title: 'Inverse' }
            ],
            data: sortedKeys
        },
        tooltip: { show: true, trigger: 'axis' }
    }

    // If we only wants to show the top N sensors:
    if (showTopN) {
        options['legend']['selected'] = {}
        sortedKeys.forEach((tag, index) => {
            if (index < showTopN) {
                options['legend']['selected'][tag] = true
            }
            else {
                options['legend']['selected'][tag] = false
            }
        })
    }

    return options
}

// --------------------------------------------------
// Build the eChart series for the detected anomalies
// --------------------------------------------------
function buildAnomaliesSeries(anomalies) {
    const results = buildTimeseries2(anomalies, 'anomaly', 'N')

    let series = [
        {
            symbol: 'none',
            data: results['data'],
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
        }
    ]

    return series
}

// --------------------------------------------------
// Build the eChart series for the detected anomalies
// --------------------------------------------------
function buildRawAnomaliesSeries(anomalies, rawAnomalies) {
    const anomalyScoreResults = buildTimeseries2(rawAnomalies, 'anomaly_score', 'N')

    const gradientAlphaChannel = 0.5
    let series = [
        {
            symbol: 'none',
            data: anomalyScoreResults['data'],
            type: 'line',
            lineStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 1.00, color: `rgba(103, 163, 83)` }, // Green (#67a353)
                        { offset: 0.65, color: `rgba(103, 163, 83)` }, // Green (#67a353)
                        { offset: 0.50, color: `rgba(224, 121, 65)` }, // Orange (#e07941)
                        { offset: 0.00, color: `rgba(163,  41, 82)` }  // Red (#a32952)
                    ]
                },
                opacity: 1.0,
                shadowColor: 'rgba(0, 0, 0, 0.2)',
                shadowBlur: 5,
                width: 2.0
            },
            xAxisIndex: 1,
            yAxisIndex: 1,
            markLine: {
                symbol: "none",
                label: { show: false },
                lineStyle: { color: "#000000", width: 2},
                data: [{name: "threshold", yAxis: 0.5}]
            },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 1.00, color: `rgba(103, 163, 83, 0.1)` },                     // Green (#67a353)
                        { offset: 0.50, color: `rgba(103, 163, 83, ${gradientAlphaChannel})` }, // Green (#67a353)
                        { offset: 0.45, color: `rgba(224, 121, 65, 0.2)` },                     // Orange (#e07941)
                        { offset: 0.20, color: `rgba(224, 121, 65, ${gradientAlphaChannel})` }, // Orange (#e07941)
                        { offset: 0.10, color: `rgba(163,  41, 82, ${gradientAlphaChannel})` }, // Red (#a32952)
                        { offset: 0.00, color: `rgba(163,  41, 82, ${gradientAlphaChannel})` }  // Red (#a32952)
                    ]
                }
            }
        }

    ]

    return series
}

// -----------------------------------------------------
// Builds the eChart series for the sensor contributions
// -----------------------------------------------------
function buildSensorContributionSeries(tagsList, samplingRate, startTime, endTime, sensorContribution) {
    let totalContribution = {}
    let data = {}

    sensorContribution.forEach((item, index) => {
        const x = new Date(item.timestamp.N * 1000)

        if (index > 1) {
            const previousX = new Date(sensorContribution[index - 1].timestamp.N * 1000)
            if (x - previousX > samplingRate * 1000) {
                tagsList.forEach((tag) => {
                    data[tag].push([x, null])
                })
            }
        }

        tagsList.forEach((tag) => {
            const y = parseFloat(item[tag].N)
            if (!data[tag]) { data[tag] = []}
            data[tag].push([x, y])

            if (!totalContribution[tag]) { totalContribution[tag] = 0.0}
            totalContribution[tag] += y
        })
    })

    // Sort the list of tags by decreasing total contribution level over the period:
    let sortedKeys = sortDictionnary(totalContribution, false)

    // Assemble the series object to be plotted with eChart:
    let sensorContributionSeries = []
    sortedKeys.forEach((tag) => {
        sensorContributionSeries.push({
            symbol: 'none',
            data: data[tag],
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
    })

    return {
        totalContribution: totalContribution,
        sortedKeys: sortedKeys,
        sensorContributionSeries: sensorContributionSeries
    }
}

// -------------------------------------------
// Prepare the time series data of the signals
// -------------------------------------------
function buildSignalSeries(timeseries, sortedKeys) {    
    let signalSeries = []
    let data = {}

    // Prepare the raw time series data:
    timeseries.Items.forEach((item) => {
        const x = new Date(item.unix_timestamp.N * 1000)

        sortedKeys.forEach((tag) => {
            const y = parseFloat(item[tag].S)
            if (!data[tag]) { data[tag] = [] }
            data[tag].push([x, y])
        })

    })

    // Assemble eChart format series:
    sortedKeys.forEach((tag) => {
        signalSeries.push({
            name: tag,
            symbol: 'none',
            sampling: 'lttb',
            data: data[tag],
            type: 'line',
            emphasis: { focus: "series" },
            xAxisIndex: 3,
            yAxisIndex: 3,
            tooltip: { valueFormatter: (value) => value.toFixed(2) },
            lineStyle: { width: 2.0 }
        })
    })

    return signalSeries
}

// **************************************************************************************
// THE FOLLOWING FUNCTIONS ARE USED TO EXTRACT ALL THE
// NECESSARY DATA TO DISPLAY THE DETAILED SIGNALS OVERVIEW
// **************************************************************************************

// ------------------------------------------------------------------
// Builds the eChart options object to plot the signal behavior chart
// ------------------------------------------------------------------
export function buildSignalBehaviorOptions(tagsList, trainingTimeseries, inferenceTimeseries, anomalies, sensorContribution, samplingRate) {
    let options = {}
    let yMin = undefined
    let yMax = undefined
    const xAnomalies = getAnomaliesXCoordinates(anomalies)

    // We want to build a chart options for each individual tag:
    tagsList.forEach((tag) => {
        const {trainingSeries, trainingYMin, trainingYMax} = getTagTrainingTimeseries(tag, trainingTimeseries.timeseries)
        const {inferenceSeries, inferenceYMin, inferenceYMax} = getTagInferenceTimeseries(tag, inferenceTimeseries, xAnomalies, sensorContribution, samplingRate)
        const histogramsSeries = getHistograms(tag, trainingTimeseries, inferenceTimeseries, xAnomalies)

        inferenceYMin < trainingYMin ? yMin = inferenceYMin : yMin = trainingYMin
        inferenceYMax > trainingYMax ? yMax = inferenceYMax : yMax = trainingYMax

        options[tag] = {}
        options[tag]['trainingTimeSeries'] = {
            title: [{top: 0, text: 'Training data timeseries'}],
            grid: [{top: 40, left: 50, height: 200}],
            xAxis: [{type: 'time', minorTick: { show: true }}],
            yAxis: [{show: true, min: yMin, max: yMax}],
            series: [trainingSeries],
            animation: false,
            tooltip: {show: true, trigger: 'axis'}
        }

        options[tag]['inferenceTimeSeries'] = {
            title: [{top: 0, text: 'Live data timeseries'}],
            grid: [{top: 40, left: 50, height: 200}],
            xAxis: {type: 'time', minorTick: { show: true }},
            yAxis: [
                {show: true, min: yMin, max: yMax},
                {
                    min: 0.0, max: 1.0,
                    axisLabel: { formatter: (value) => { return (value*100).toFixed(0) + '%' }},
                    splitLine: { show: false },
                    splitArea: { show: false }
                }
            ],
            series: inferenceSeries,
            animation: false,
            tooltip: {show: true, trigger: 'axis'},
            legend: {
                show: true,
                bottom: -5, left: 0,
                orient: 'horizontal',
                data: ['Time series', 'Anomalies', 'Contribution (%)']
            },
        },

        options[tag]['histograms'] = {
            title: {top: 0, text: 'Signal value distributions'},
            grid: {top: 40, left: 50, height: 200},
            xAxis: {scale: true},
            yAxis: {},
            series: histogramsSeries,
            animation: false,
            tooltip: {show: true, trigger: 'axis'}
        }
    })

    return options
}

// --------------------------------------------------
// Get the x-coordinates for all the anomalies: will
// be used to distinguish between datapoints that are
// anomalous and the others
// --------------------------------------------------
function getAnomaliesXCoordinates(anomalies) {
    let xAnomalies = []

    anomalies.forEach((item) => {
        if (parseInt(item.anomaly.N) == 1) {
            xAnomalies.push(parseInt(item.timestamp.N))
        }
    })

    return xAnomalies
}

// ------------------------------------------------
// Plot configuration for the inference time series
// ------------------------------------------------
function getTagInferenceTimeseries(tag, timeseries, xAnomalies, sensorContribution, samplingRate) {
    let data = []
    let dataAnomalies = []
    let dataContribution = []
    let yMin = undefined
    let yMax = undefined

    // Prepare the raw time series data:
    timeseries.Items.forEach((item) => {
        const x = new Date(item.unix_timestamp.N * 1000)
        const y = parseFloat(item[tag].S)
        data.push([x, y])

        if (xAnomalies.indexOf(parseInt(item.unix_timestamp.N)) > 0) {
            dataAnomalies.push([x, y])
        }

        if (!yMin) { yMin = y }
        if (!yMax) { yMax = y }
        if (y < yMin) { yMin = y }
        if (y > yMax) { yMax = y }
    })

    // Prepare the sensor contribution as a time series:
    sensorContribution.forEach((item, index) => {
        const x = new Date(item.timestamp.N * 1000)
        const y = parseFloat(item[tag].N)

        if (index > 1) {
            const previousX = new Date(sensorContribution[index - 1].timestamp.N * 1000)
            if (x - previousX > samplingRate * 1000) {
                dataContribution.push([x, null])
            }
        }

        dataContribution.push([x, y])
    })

    const series = {
        name: 'Time series',
        symbol: 'none',
        sampling: 'lttb',
        data: data,
        type: 'line',
        tooltip: { valueFormatter: (value) => value.toFixed(2) },
        lineStyle: { color: '#67a353', width: 2.0 },
        itemStyle: { color: '#67a353' },
        yAxisIndex: 0
    }

    const anomaliesSeries = {
        name: 'Anomalies',
        symbol: 'circle',
        symbolSize: 3.0,
        sampling: 'lttb',
        data: dataAnomalies,
        type: 'line',
        tooltip: { valueFormatter: (value) => value.toFixed(2) },
        lineStyle: { width: 0.0 },
        itemStyle: { color: '#a32952', opacity: 0.5 },
        yAxisIndex: 0
    }

    const contributionSeries = {
        name: 'Contribution (%)',
        symbol: 'none',
        sampling: 'lttb',
        data: dataContribution,
        type: 'line',
        color: '#e07941',
        tooltip: { valueFormatter: (value) => (value*100).toFixed(0) + '%' },
        areaStyle: { opacity: 0.2 },
        lineStyle: { width: 0.5 },
        yAxisIndex: 1
    }

    return {
        inferenceYMin: (yMin * 0.95).toFixed(2),
        inferenceYMax: (yMax * 1.05).toFixed(2),
        inferenceSeries: [series, anomaliesSeries, contributionSeries]
    }
}

// -----------------------------------------------
// Plot configuration for the training time series
// -----------------------------------------------
function getTagTrainingTimeseries(tag, timeseries) {
    let data = []
    let yMin = undefined
    let yMax = undefined

    // Prepare the raw time series data:
    timeseries.Items.forEach((item) => {
        const x = new Date(item.unix_timestamp.N * 1000)
        const y = parseFloat(item[tag].S)
        data.push([x, y])

        if (!yMin) { yMin = y }
        if (!yMax) { yMax = y }
        if (y < yMin) { yMin = y }
        if (y > yMax) { yMax = y }
    })

    const series = {
        name: tag,
        symbol: 'none',
        sampling: 'lttb',
        data: data,
        type: 'line',
        emphasis: { focus: "series" },
        tooltip: { valueFormatter: (value) => value.toFixed(2) },
        lineStyle: { width: 2.0 }
    }

    return {
        trainingSeries: series,
        trainingYMin: (yMin * 0.95).toFixed(2),
        trainingYMax: (yMax * 1.05).toFixed(2)
    }
}

// -------------------------------------
// Plot configuration for the histograms
// -------------------------------------
function getHistograms(tag, trainingTimeseries, inferenceTimeseries, xAnomalies) {
    let trainingData = []
    let inferenceData = []
    let abnormalData = []

    trainingTimeseries.timeseries.Items.forEach((item) => {
        trainingData.push(parseFloat(item[tag].S))
    })

    inferenceTimeseries.Items.forEach((item) => {
        const x = parseInt(item.unix_timestamp.N)
        const y = parseFloat(item[tag].S)

        inferenceData.push(y)
        if (xAnomalies.indexOf(x)) { abnormalData.push(y) }
    })

    let series = [
        {
            name: 'Training data distribution',
            type: 'bar',
            barWidth: 8,
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: { color: '#529ccb', opacity: 0.5 },
            data: histogram(trainingData).data,
        },
        {
            name: 'Inference data distribution',
            type: 'bar',
            barWidth: 8,
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: { color: '#67a353', opacity: 0.7 },
            data: histogram(inferenceData).data,
        },
        {
            name: 'Abnormal data distribution',
            type: 'bar',
            barWidth: 8,
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: { color: '#a32952', opacity: 0.5 },
            data: histogram(abnormalData).data,
        },
    ]

    return series
}

// ------------------------------------------------------
// Sort the signal list by decreasing signal contribution
// ------------------------------------------------------
export function getSortedKeys(tagsList, sensorContribution) {
    let totalContribution = {}

    sensorContribution.forEach((item) => {
        tagsList.forEach((tag) => {
            const y = parseFloat(item[tag].N)

            if (!totalContribution[tag]) { totalContribution[tag] = 0.0}
            totalContribution[tag] += y
        })
    })

    let sortedKeys = sortDictionnary(totalContribution, false)

    return sortedKeys
}

// **************************************************************************************
// SCHEDULER INSPECTOR UTILITIES
// **************************************************************************************

// -------------------------
// Get the scheduler details
// -------------------------
export async function getSchedulerDetails(gateway, modelName, uid, projectName) {
    const bucket = awsmobile['aws_user_files_s3_bucket']
    const possibleFrequency = {
        'PT5M': 5,
        'PT10M': 10,
        'PT15M': 15,
        'PT30M': 30,
        'PT1H': 60
    }

    // Start by getting the direct scheduler details:
    const response = await getSchedulerInfo(gateway, modelName)

    let schedulerBadgeColor = 'grey'
    switch (response['Status']) {
        case 'STOPPED': schedulerBadgeColor = 'blue'; break
        case 'STOPPING': schedulerBadgeColor = 'blue'; break
        case 'RUNNING': schedulerBadgeColor = 'green'; break
    }

    // Get next time:
    const currentTime = Date.now()
    const nextExecutionTime = getNextExecutionTime(currentTime, possibleFrequency[response['DataUploadFrequency']])
    const nextTimestamp = getNextExecutionTimestamp(nextExecutionTime, response['DataInputConfiguration']['InferenceInputNameConfiguration']['TimestampFormat'])

    // Get delimiter between component and timestamp:
    const delimiter = response['DataInputConfiguration']['InferenceInputNameConfiguration']['ComponentTimestampDelimiter']

    // Get file content:
    const content = await getExpectedContent(gateway, uid, projectName)

    return {
        status: response['Status'],
        statusColor: schedulerBadgeColor,
        frequency: possibleFrequency[response['DataUploadFrequency']],
        delay: response['DataDelayOffsetInMinutes'],
        currentTime: new Date(currentTime).toISOString().replace('T', ' ').slice(0,16),
        nextExecutionTime: new Date(nextExecutionTime).toISOString().replace('T', ' ').slice(0,16),
        nextTimestamp: nextTimestamp,
        inputLocation: `s3://${bucket}/inference-data/${uid}-${modelName}/input/`,
        outputLocation: `s3://${bucket}/inference-data/${uid}-${modelName}/output/`,
        delimiter: delimiter,
        expectedContent: content
    }
}

// ---------------------------
// Get the next execution time
// ---------------------------
function getNextExecutionTime(currentTime, frequency) {
    const now = new Date(currentTime)
    const nextTime = now - 
                     (now.getMinutes() % frequency) * 60 * 1000 -
                     now.getSeconds() * 1000 +
                     frequency * 60 * 1000
    
    return nextTime
}

// ---------------------------------------------------------
// Get the timestamp that must be included in the file name
// of the inference input file so that Lookout for Equipment
// can find it
// ---------------------------------------------------------
function getNextExecutionTimestamp(nextTime, timestampFormat) {
    const nextDateTime = new Date(nextTime)

    let timestamp = ""
    switch (timestampFormat) {
        case 'yyyyMMddHHmmss':
            timestamp = nextDateTime.getFullYear().toString() +
                        (nextDateTime.getMonth() + 1).toString().padStart(2, 0) +
                        nextDateTime.getDate().toString().padStart(2, 0) + 
                        nextDateTime.getHours().toString().padStart(2, 0) + 
                        nextDateTime.getMinutes().toString().padStart(2, 0) + 
                        nextDateTime.getSeconds().toString().padStart(2, 0)
            break

        case 'yyyy-MM-dd-HH-mm-ss':
            timestamp = nextDateTime.getFullYear().toString() + '-' +
                        (nextDateTime.getMonth() + 1).toString().padStart(2, 0) + '-' +
                        nextDateTime.getDate().toString().padStart(2, 0) + '-' +
                        nextDateTime.getHours().toString().padStart(2, 0) + '-' +
                        nextDateTime.getMinutes().toString().padStart(2, 0) + '-' +
                        nextDateTime.getSeconds().toString().padStart(2, 0)
            break

        case 'epoch':
            timestamp = parseInt(nextDateTime.getTime() / 1000)
            break
    }
    
    return timestamp
}

// ----------------------------------------------------
// Get the columns expected in the input inference file
// ----------------------------------------------------
async function getExpectedContent(gateway, uid, projectName) {
    const datasetName = 'l4e-demo-app-' + uid + '-' + projectName
    const response = await gateway.lookoutEquipmentDescribeDataset(datasetName)
    const columns = JSON.parse(response['Schema'])['Components'][0]['Columns']

    let content = ""
    columns.forEach((col) => {
        content += '- ' + col['Name'] + "\n"
    })

    return content
}