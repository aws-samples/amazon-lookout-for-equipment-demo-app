// Imports:
import { useContext } from 'react'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"

// App components:
import EmptyState from '../shared/EmptyState'

// Cloudscape components:
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
import { getMatchesCountText, normalizedHistogram } from '../../utils/utils'

// Contexts:
import HelpPanelContext from '../contexts/HelpPanelContext'
import OfflineResultsContext from '../contexts/OfflineResultsContext'

function SignalHistograms() {
    const { 
        modelDetails, 
        tagsList, 
        trainingTimeseries,
        evaluationTimeseries, 
        anomaliesTimeseries,
        sensorContributionTimeseries,
        histogramData
    } = useContext(OfflineResultsContext)
    const { setHelpPanelOpen } = useContext(HelpPanelContext)

    const signalOptions = buildSignalBehaviorOptions(
        tagsList, 
        trainingTimeseries,
        evaluationTimeseries,
        anomaliesTimeseries,
        sensorContributionTimeseries,
        histogramData
    )

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
                header={
                    <Header
                        variant="h2"
                        info={<Link variant="info" onFollow={() => setHelpPanelOpen({
                            status: true,
                            page: 'offlineResults',
                            section: 'signalDeepDive'
                        })}>Info</Link>}>
                            Signal behavior deep dive
                    </Header>
                }
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
function buildSignalBehaviorOptions(tagsList, 
                                    trainingTimeseries, 
                                    evaluationTimeseries, 
                                    anomaliesTimeseries, 
                                    sensorContributionTimeseries, 
                                    histogramData
) {
    // We want to build a chart options for each individual tag:
    let options = {}
    tagsList.forEach((tag) => {
        // Configures the time series:
        const trainingSeries = getTrainingSeries(tag, trainingTimeseries)
        const { evaluationSeries, anomaliesSeries } = getEvaluationSeries(tag, evaluationTimeseries, anomaliesTimeseries)
        const sensorContributionSeries = getSensorContributionSeries(tag, sensorContributionTimeseries)
        const histogramsSeries = getHistogramSeries(tag, histogramData)
        
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
            yAxis: {axisLabel: { show: false }},
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

// -----------------------------------------------
// Plot configuration for the training time series
// -----------------------------------------------
function getTrainingSeries(tag, timeseries) {
    const series = {
        name: tag,
        symbol: 'none',
        sampling: 'lttb',
        data: timeseries[tag],
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
function getEvaluationSeries(tag, evaluationTimeseries, anomaliesTimeseries) {
    const evaluationSeries = {
        name: tag,
        symbol: 'none',
        sampling: 'lttb',
        data: evaluationTimeseries[tag],
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
        data: anomaliesTimeseries[tag],
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
function getSensorContributionSeries(tag, sensorContributionTimeseries) {
    const contributionSeries = {
        name: 'Contribution (%)',
        symbol: 'none',
        sampling: 'lttb',
        data: sensorContributionTimeseries[tag],
        type: 'line',
        color: '#e07941',
        step: true,
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
function getHistogramSeries(tag, histogramData) {
    let series = [
        {
            name: 'Training range',
            type: 'bar',
            barWidth: 8,
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: { color: '#529ccb', opacity: 0.5 },
            data: normalizedHistogram(histogramData.training[tag]).data,
        },
        {
            name: 'Evaluation range',
            type: 'bar',
            barWidth: 8,
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: { color: '#67a353', opacity: 0.7 },
            data: normalizedHistogram(histogramData.evaluation[tag]).data,
        },
        {
            name: 'Anomalies',
            type: 'bar',
            barWidth: 8,
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: { color: '#a32952', opacity: 0.5 },
            data: normalizedHistogram(histogramData.anomalies[tag]).data,
        },
    ]

    return series
}