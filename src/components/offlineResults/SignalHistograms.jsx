// Imports:
import { useContext } from 'react'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"

// App components:
import EmptyState from '../shared/EmptyState'

// Cloudscape components:
import Button       from "@cloudscape-design/components/button"
import Cards        from "@cloudscape-design/components/cards"
import Container    from "@cloudscape-design/components/container"
import Grid         from "@cloudscape-design/components/grid"
import Header       from "@cloudscape-design/components/header"
import Link         from "@cloudscape-design/components/link"
import Pagination   from "@cloudscape-design/components/pagination"
import Spinner      from "@cloudscape-design/components/spinner"
import TextFilter   from "@cloudscape-design/components/text-filter"

// Utils
import { useCollection } from '@cloudscape-design/collection-hooks'
import { getMatchesCountText, normalizedHistogram, sortDictionnary } from '../../utils/utils'

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

    // If no sensor contribution contribution data is found, this means 
    // that no anomalous event was found while evaluating the model. 
    // Hence, nothing to show here:
    if (!sensorContributionTimeseries) {
        return (
            <Container header={<Header variant="h1">Signal behavior deep dive</Header>}>
                No event detected by this model
            </Container>
        )
    }

    const sortedTags = getSortedTags(sensorContributionTimeseries, tagsList)
    const signalOptions = buildSignalBehaviorOptions(
        sortedTags, 
        trainingTimeseries,
        evaluationTimeseries,
        anomaliesTimeseries,
        sensorContributionTimeseries,
        histogramData
    )

    let cardItems = []
    sortedTags.forEach((tag) => {
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
                                    style={{height: 300, width: "100%"}}
                                    opts={{ renderer: 'svg' }}
                                />
                                <ReactEcharts 
                                    option={e.histogramsChartOptions}
                                    theme="macarons"
                                    style={{height: 300, width: "100%"}}
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
function buildSignalBehaviorOptions(sortedTags, 
                                    trainingTimeseries, 
                                    evaluationTimeseries, 
                                    anomaliesTimeseries, 
                                    sensorContributionTimeseries, 
                                    histogramData
) {
    // We want to build a chart options for each individual tag:
    let options = {}
    sortedTags.forEach((tag) => {
        // Configures the time series:
        const trainingSeries = getTrainingSeries(tag, trainingTimeseries)
        const { evaluationSeries, anomaliesSeries } = getEvaluationSeries(tag, evaluationTimeseries, anomaliesTimeseries)
        const sensorContributionSeries = getSensorContributionSeries(tag, sensorContributionTimeseries)
        const histogramsSeries = getHistogramSeries(tag, histogramData)
        
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
            dataZoom: { type:'slider', start: 0, end: 100, top: 270, height: 20},
            legend: {
                show: true,
                top: 0, right: 40,
                orient: 'horizontal',
                data: ['Training', 'Evaluation', 'Detected events', 'Contribution (%)']
            },
        }

        options[tag]['histograms'] = {
            title: {top: 0, text: 'Histograms'},
            grid: {top: 40, left: 50, height: 200},
            xAxis: {scale: true},
            yAxis: {axisLabel: { show: false }},
            series: histogramsSeries,
            animation: false,
            tooltip: {show: true, trigger: 'axis'},
            dataZoom: { type:'slider', start: 0, end: 100, top: 270, height: 20, showDataShadow: false},
            legend: {
                show: true,
                top: 0, right: 0,
                orient: 'horizontal',
                data: ['Training', 'Evaluation', 'Detected events']
            },
        }
    })

    return options
}

function getSortedTags(sensorContribution, tagsList) {
    let totalContribution = {}

    tagsList.forEach((tag) => {
        const sum = sensorContribution[tag].reduce((accumulator, currentValue) => {
            return accumulator + currentValue[1]
        }, 0)
        totalContribution[tag] = sum
    })

    const sortedTags = sortDictionnary(totalContribution, false)

    return sortedTags
}

// -----------------------------------------------
// Plot configuration for the training time series
// -----------------------------------------------
function getTrainingSeries(tag, timeseries) {
    const series = {
        name: 'Training',
        symbol: 'none',
        sampling: 'lttb',
        data: timeseries[tag],
        type: 'line',
        emphasis: { disabled: true },
        tooltip: { valueFormatter: (value) => value.toFixed(2) },
        lineStyle: { width: 2.0, color: '#529ccb', opacity: 0.7 },
        itemStyle: { color: '#529ccb', opacity: 0.7 }
    }

    return series
}

// --------------------------------------------------------------
// Plot configuration for the training and evaluation time series
// --------------------------------------------------------------
function getEvaluationSeries(tag, evaluationTimeseries, anomaliesTimeseries) {
    const evaluationSeries = {
        name: 'Evaluation',
        symbol: 'none',
        sampling: 'lttb',
        data: evaluationTimeseries[tag],
        type: 'line',
        emphasis: { disabled: true },
        tooltip: { valueFormatter: (value) => value.toFixed(2) },
        lineStyle: { width: 2.0, color: '#67a353', opacity: 0.7 },
        itemStyle: { color: '#67a353', opacity: 0.7 }
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
        lineStyle: { width: 0.0, color: '#a32952', opacity: 0.7 },
        itemStyle: { color: '#a32952', opacity: 0.7 }
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
        step: true,
        tooltip: { valueFormatter: (value) => (value*100).toFixed(0) + '%' },
        areaStyle: { color: '#e07941', opacity: 0.2 },
        lineStyle: { color: '#e07941', width: 0.5 },
        itemStyle: { color: '#e07941', opacity: 0.5 },
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
            name: 'Training',
            type: 'bar',
            barWidth: 8,
            barGap: '-100%',
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: { color: '#529ccb', opacity: 0.7 },
            data: normalizedHistogram(histogramData.training[tag]).data,
        },
        {
            name: 'Evaluation',
            type: 'bar',
            barWidth: 8,
            barGap: '-100%',
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: { color: '#67a353', opacity: 0.7 },
            data: normalizedHistogram(histogramData.evaluation[tag]).data,
        },
        {
            name: 'Detected events',
            type: 'bar',
            barWidth: 8,
            barGap: '-100%',
            xAxisIndex: 0,
            yAxisIndex: 0,
            itemStyle: { color: '#a32952', opacity: 0.7 },
            data: normalizedHistogram(histogramData.anomalies[tag]).data,
        },
    ]

    return series
}