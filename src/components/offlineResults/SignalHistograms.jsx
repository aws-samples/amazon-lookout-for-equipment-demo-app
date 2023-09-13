// Imports:
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"
import { histogram } from 'echarts-stat'

// App components:
import EmptyState from '../shared/EmptyState'

// Cloudscape components:
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Cards        from "@cloudscape-design/components/cards"
import Grid         from "@cloudscape-design/components/grid"
import Header       from "@cloudscape-design/components/header"
import Link         from "@cloudscape-design/components/link"
import Pagination   from "@cloudscape-design/components/pagination"
import Spinner      from "@cloudscape-design/components/spinner"
import TextFilter   from "@cloudscape-design/components/text-filter"

// Utils
import { useCollection } from '@cloudscape-design/collection-hooks'
import { getMatchesCountText, cleanList, binarySearchBins } from '../../utils/utils'
// import { buildSignalBehaviorOptions } from './schedulerUtils.js'

// Contexts:
import HelpPanelContext from '../contexts/HelpPanelContext'

function SignalHistograms({ modelDetails }) {
    // Cleaning tags list up:
    let tagsList = modelDetails['tagsList']
    const tagsToRemove = ['asset', 'sampling_rate', 'timestamp', 'unix_timestamp']
    tagsList = cleanList(tagsToRemove, tagsList)
    
    const signalOptions = buildSignalBehaviorOptions(modelDetails, tagsList)

    let cardItems = []
    tagsList.forEach((tag) => {
        cardItems.push({
            name: tag,
            trainingChartOptions: signalOptions[tag]['trainingTimeSeries'],
            histogramsChartOptions: signalOptions[tag]['histograms']
        })
    })

    // Add filtering and pagination to the table:
    const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
        cardItems,
        {
            filtering: {
                noMatch: (
                    <EmptyState
                        title="No matches"
                        action={<Button onClick={() => actions.setFiltering('')}>Clear filter</Button>}
                    />
                )
            },
            pagination: { pageSize: 5 }
        }
    )

    if (modelDetails && modelDetails['status'] === 'SUCCESS') {
        return (
            <Cards
                {...collectionProps}
    
                cardsPerRow={[{ cards: 1 }]}
                // header={
                //     <Header
                //         variant="h2"
                //         info={<Link variant="info" onFollow={() => setHelpPanelOpen({
                //             status: true,
                //             page: 'onlineResults',
                //             section: 'signalDeepDive'
                //         })}>Info</Link>}>
                //             Signal behavior deep dive
                //     </Header>
                // }
                cardDefinition={{
                    header: e => e.name,
                    sections: [
                        {
                            id: 'charts',
                            content: e => <Grid 
                                disableGutters={true}
                                gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}
                            >
                                <ReactEcharts 
                                    option={e.trainingChartOptions}
                                    theme="macarons"
                                    style={{height: 280, width: "100%"}}
                                    opts={{ renderer: 'svg' }}
                                />
                                <ReactEcharts 
                                    option={e.histogramsChartOptions}
                                    theme="macarons"
                                    style={{height: 280, width: "100%"}}
                                    opts={{ renderer: 'svg' }}
                                />
                            </Grid>
                        },
                    ]
                }}
                items={items}
                trackBy="name"
                filter={
                    <TextFilter
                        {...filterProps}
                        countText={getMatchesCountText(filteredItemsCount)}
                    />
                }
                pagination={<Pagination {...paginationProps} />}
            />
        )
    }
    else {
        return (<Spinner />)
    }
}

export default SignalHistograms

// **************************************************************************************
// THE FOLLOWING FUNCTIONS ARE USED TO EXTRACT ALL THE
// NECESSARY DATA TO DISPLAY THE DETAILED SIGNALS OVERVIEW
// **************************************************************************************

// ------------------------------------------------------------------
// Builds the eChart options object to plot the signal behavior chart
// ------------------------------------------------------------------
function buildSignalBehaviorOptions(modelDetails, tagsList) {
    let options = {}

    const trainingStart = new Date(modelDetails['trainingStart'])
    const trainingEnd = new Date(modelDetails['trainingEnd'])
    const evaluationStart = new Date(modelDetails['evaluationStart'])
    const evaluationEnd = new Date(modelDetails['evaluationEnd'])
    const sensorContribution = modelDetails['sensorContribution']
    const samplingRate = modelDetails['samplingRate']
    const events = modelDetails['events']

    // We want to build a chart options for each individual tag:
    tagsList.forEach((tag, index) => {
        // Configures the time series:
        const trainingSeries = getTagTimeseries(tag, modelDetails.timeseries, trainingStart, trainingEnd)
        const { evaluationSeries, anomaliesSeries } = getEvaluationTimeseries(tag, modelDetails.timeseries, evaluationStart, evaluationEnd, events)
        const sensorContributionSeries = getSensorContributionSeries(tag, sensorContribution, samplingRate)
        const histogramsSeries = getHistograms(tag, modelDetails.timeseries, trainingStart, trainingEnd, evaluationStart, evaluationEnd, events)
        
        evaluationSeries['lineStyle'] = { color: '#67a353', width: 2.0 }
        evaluationSeries['color'] = '#67a353'
        evaluationSeries['name'] = 'Evaluation range'
        trainingSeries['name'] = 'Training range'

        options[tag] = {}
        options[tag]['trainingTimeSeries'] = {
            title: {top: 0, text: 'Training data timeseries'},
            grid: {top: 40, left: 50, height: 200},
            xAxis: {type: 'time', minorTick: { show: true }},
            yAxis: [
                {show: true},
                {
                    min: 0.0, max: 1.0,
                    axisLabel: { formatter: (value) => { return (value*100).toFixed(0) + '%' }},
                    splitLine: { show: false },
                    splitArea: { show: false }
                }
            ],
            series: [trainingSeries, evaluationSeries, anomaliesSeries, sensorContributionSeries],
            animation: false,
            tooltip: {show: true, trigger: 'axis'},
            legend: {
                show: true,
                bottom: -5, left: 0,
                orient: 'horizontal',
                data: ['Training range', 'Evaluation range', 'Detected events', 'Contribution (%)']
            },
        }

        options[tag]['histograms'] = {
            title: {top: 0, text: 'Signal value distributions'},
            grid: {top: 40, left: 50, height: 200},
            xAxis: {scale: true},
            yAxis: {},
            series: histogramsSeries,
            animation: false,
            tooltip: {show: true, trigger: 'axis'},
            legend: {
                show: true,
                bottom: -5, left: 0,
                orient: 'horizontal',
                data: ['Training range', 'Evaluation range', 'Anomalies']
            },
        }
    })

    return options
}

// --------------------------------------------------------------
// Plot configuration for the training and evaluation time series
// --------------------------------------------------------------
function getTagTimeseries(tag, timeseries, start, end) {
    let data = []

    // Prepare the raw time series data:
    timeseries.Items.forEach((item) => {
        const x = new Date(item.unix_timestamp.N * 1000)
        if (x >= start && x <= end) {
            const y = parseFloat(item[tag].S)
            data.push([x, y])
        }
    })

    const series = {
        name: tag,
        symbol: 'none',
        sampling: 'lttb',
        data: data,
        type: 'line',
        emphasis: { disabled: true },
        tooltip: { valueFormatter: (value) => value.toFixed(2) },
        lineStyle: { width: 2.0 }
    }

    return series
}

// --------------------------------------------------------------
// Plot configuration for the training and evaluation time series
// --------------------------------------------------------------
function getEvaluationTimeseries(tag, timeseries, start, end, events) {
    let data = []
    let dataAnomalies = []

    // Prepare the raw time series data:
    timeseries.Items.forEach((item) => {
        const x = new Date(item.unix_timestamp.N * 1000)
        if (x >= start && x <= end) {
            const y = parseFloat(item[tag].S)
            data.push([x, y])

            if (binarySearchBins(events, x) >= 0) {
                dataAnomalies.push([x, y])
            }
        }
    })

    const evaluationSeries = {
        name: tag,
        symbol: 'none',
        sampling: 'lttb',
        data: data,
        type: 'line',
        emphasis: { disabled: true },
        tooltip: { valueFormatter: (value) => value.toFixed(2) },
        lineStyle: { width: 2.0 }
    }

    const anomaliesSeries = {
        name: 'Detected events',
        symbol: 'circle',
        symbolSize: 3.0,
        sampling: 'lttb',
        data: dataAnomalies,
        type: 'line',
        emphasis: { disabled: true },
        tooltip: { valueFormatter: (value) => value.toFixed(2) },
        lineStyle: { width: 0.0 }
    }

    return {evaluationSeries, anomaliesSeries}
}

// ----------------------------------------------------------
// Plot configuration for the sensor contribution time series
// ----------------------------------------------------------
function getSensorContributionSeries(tag, sensorContribution) {
    let dataContribution = []

    // Prepare the sensor contribution as a time series:
    sensorContribution.Items.forEach((item, index) => {
        const x = new Date(item.timestamp.N * 1000)
        const y = parseFloat(item[tag].S)

        dataContribution.push([x, y])
    })

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

    return contributionSeries
}

// -------------------------------------
// Plot configuration for the histograms
// -------------------------------------
function getHistograms(tag, timeseries, trainingStart, trainingEnd, evaluationStart, evaluationEnd, events) {
    let trainingData = []
    let evaluationData = []
    let abnormalData = []

    timeseries.Items.forEach((item) => {
        const x = new Date(item.unix_timestamp.N * 1000)
        const y = parseFloat(item[tag].S)

        if (x >= trainingStart && x <= trainingEnd) {
            trainingData.push(y)
        }
        if (x >= evaluationStart && x <= evaluationEnd) {
            evaluationData.push(y)
        }

        // Search if the the current data point falls
        // within one of the detected event range:
        const isAnomaly = binarySearchBins(events, x)
        if (isAnomaly >= 0) {
            abnormalData.push(y)
        }
    })

    let series = [
        {
            name: 'Training range',
            type: 'bar',
            barWidth: 8,
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: { color: '#529ccb', opacity: 0.5 },
            data: histogram(trainingData).data,
        },
        {
            name: 'Evaluation range',
            type: 'bar',
            barWidth: 8,
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: { color: '#67a353', opacity: 0.7 },
            data: histogram(evaluationData).data,
        },
        {
            name: 'Anomalies',
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