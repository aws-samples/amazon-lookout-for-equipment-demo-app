// Imports:
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"

// Cloudscape components:
import Alert from "@cloudscape-design/components/alert"
import Badge from "@cloudscape-design/components/badge"
import Box from "@cloudscape-design/components/box"
import Cards from "@cloudscape-design/components/cards"
import Checkbox from "@cloudscape-design/components/checkbox"
import Header from "@cloudscape-design/components/header"
import Pagination from "@cloudscape-design/components/pagination"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Spinner from "@cloudscape-design/components/spinner"
import Tabs from "@cloudscape-design/components/tabs"
import TextFilter from "@cloudscape-design/components/text-filter"

// App components:
import { getSignalDetails } from '../../utils/dataExtraction'
import TimeSeriesHistograms from '../charts/TimeSeriesHistogram.jsx'

// Contexts:
import TimeSeriesContext from '../contexts/TimeSeriesContext'
import ApiGatewayContext from '../contexts/ApiGatewayContext'
import ModelParametersContext from '../contexts/ModelParametersContext'

function getSignalsDetails(signalDetails) {
    let signalInfos = {}
    let signalAttributes = {}

    signalDetails['sensorStatistics'].forEach((signal) => {
        signalInfos[signal['SensorName']] = []
        if (signal['CategoricalValues']['Status'] !== 'NO_ISSUE_DETECTED') {
            signalInfos[signal['SensorName']].push(<Badge color="red">Categorical</Badge>)
        }
        if (signal['LargeTimestampGaps']['Status'] !== 'NO_ISSUE_DETECTED') {
            signalInfos[signal['SensorName']].push(<Badge color="red">Large gaps</Badge>)
        }
        if (signal['MonotonicValues']['Status'] !== 'NO_ISSUE_DETECTED') {
            signalInfos[signal['SensorName']].push(<Badge color="red">Monotonic</Badge>)
        }
        if (signal['MultipleOperatingModes']['Status'] !== 'NO_ISSUE_DETECTED') {
            signalInfos[signal['SensorName']].push(<Badge color="blue">Multiple modes</Badge>)
        }
        if (signal['DuplicateTimestamps']['Count'] > 0) {
            signalInfos[signal['SensorName']].push(
                <Badge color="grey">
                    {signal['DuplicateTimestamps']['Count']}
                    &nbsp;duplicate(s)
                </Badge>
            )
        }
        if (signal['InvalidDateEntries']['Count'] > 0) {
            signalInfos[signal['SensorName']].push(
                <Badge color="grey">
                    {signal['InvalidDateEntries']['Count']}
                    &nbsp;invalid entries
                </Badge>
            )
        }
        if (signal['MissingValues']['Count'] > 0) {
            signalInfos[signal['SensorName']].push(
                <Badge color="grey">
                    {signal['MissingValues']['Count']}
                    &nbsp;missing value(s)
                </Badge>
            )
        }

        signalAttributes[signal['SensorName']] = {}
        signalAttributes[signal['SensorName']]['startTime'] = new Date(signal['DataStartTime'] * 1000).toISOString().substring(0, 19).replace('T', ' ')
        signalAttributes[signal['SensorName']]['endTime'] = new Date(signal['DataEndTime'] * 1000).toISOString().substring(0, 19).replace('T', ' ')
    })

    return {
        signalAttributes: signalAttributes,
        signalInfos: signalInfos
    }
}

function buildChartOptions(tagsList, x, signals, trainingRange, evaluationRange) {
    let signalOptions = {}
    tagsList.forEach((tag) => {
        const currentSerie = [{
            name: tag,
            color: 'rgb(141, 152, 179)',
            symbol: 'none',
            sampling: 'lttb',
            data: signals[tag],
            type: 'line',
            markArea: {
                itemStyle: { color: 'rgb(151, 181, 82, 0.3)' },
                data: [
                    [
                        {
                            name: 'Training',
                            xAxis: new Date(trainingRange.current['startDate']).toISOString().substring(0, 19).replace('T', '\n')
                        },
                        {
                            xAxis: new Date(trainingRange.current['endDate']).toISOString().substring(0, 19).replace('T', '\n')
                        }
                    ],
                ]
            }
        }]

        // echart options:
        const currentOption = {
            title: { show: false },
            xAxis: { 
                type: 'category', 
                data: x, 
                min: new Date(trainingRange.current['startDate']).toISOString().substring(0, 19).replace('T', '\n'),
                max: new Date(evaluationRange.current['endDate']).toISOString().substring(0, 19).replace('T', '\n'),
            },
            yAxis: { type: 'value' },
            grid: { top: 15, left: 40, right: 10, bottom: 35 },
            series: currentSerie,
            animation: false,
        }

        signalOptions[tag] = currentOption
    })

    return signalOptions
}

// =================================
// Main entry point of the component
// =================================
function ModelingSignalSelection() {
    // Get the current model being displayed:
    const { projectName } = useParams()

    // Collect context information for time series, 
    // gateway and the current model configuration:
    const { data, tagsList, x, signals } = useContext(TimeSeriesContext)
    const { gateway } = useContext(ApiGatewayContext)
    const { trainingRange, evaluationRange, selectedItems, currentPageIndex, allChecked } = useContext(ModelParametersContext)
    const { setSelectedItems, setCurrentPageIndex, setAllChecked } = useContext(ModelParametersContext)

    // Define the state of this component
    const [signalDetails, setSignalDetails] = useState(undefined)
    const [filteringText, setFilteringText] = useState("")

    // Extract the details of the signals to be displayed:
    useEffect(() => {
        getSignalDetails(gateway, projectName)
        .then((x) => setSignalDetails(x))
    }, [gateway])

    const onSelectionChange = (newSelection) => {
        setSelectedItems(newSelection)
    }

    function toggleAllSignals(checked) {
        setAllChecked(checked)

        if (checked) {
            let selection = []
            tagsList.forEach((tag) => {
                selection.push({ 'name': tag })    
            })
            setSelectedItems(selection)
        }
        else {
            setSelectedItems([])
        }
    }

    if (!data.timeseries) {
        return (
            <Alert header="Data preparation in progress">
                Data preparation and ingestion in the app still in progress: after uploading your
                dataset, the app prepares it to optimize visualization speed. This step usually 
                takes 10 to 20 minutes depending on the size of the dataset you uploaded.
            </Alert>
        )
    }
    else if (signalDetails) {
        // Definition of a few variables necessary 
        // for managing the pagination of this screen:
        const numTagPerPage = 9
        const numPages = Math.ceil(tagsList.length / numTagPerPage)
        const startTag = parseInt((currentPageIndex - 1) * numTagPerPage)
        const endTag = startTag + numTagPerPage - 1
        const output = getSignalsDetails(signalDetails)
        const signalInfos = output['signalInfos']
        const signalAttributes = output['signalAttributes']
        const signalOptions = buildChartOptions(tagsList, x, signals, trainingRange, evaluationRange)
        
        let cardItems = []
        tagsList.forEach((tag, index) => {
            if (index >= startTag && index <= endTag) {
                cardItems.push({
                    name: tag,
                    issues: signalInfos[tag].length === 0
                        ? <Badge color="green">None</Badge> 
                        : <SpaceBetween size="xxs" direction="horizontal">{signalInfos[tag].map((issue) => issue)}</SpaceBetween>,
                    startTime: signalAttributes[tag]['startTime'],
                    endTime: signalAttributes[tag]['endTime'],
                    chartOptions: signalOptions[tag]
                })
            }
        })

        const rangeEnd = parseInt((new Date(trainingRange.current['endDate']) - new Date(x[0])) / (new Date(x[x.length - 1]) - new Date(x[0])) * x.length)

        return (
            <Cards 
                header={
                    <SpaceBetween size="xs">
                        <Header
                            counter={
                                selectedItems.length ? "(" + selectedItems.length + `/${tagsList.length})` : `(${tagsList.length})`
                            }
                        >
                            Signals available to train a model
                        </Header>
                        <Box>
                            Selected training data ranges from
                            &nbsp;<b>{new Date(trainingRange.current['startDate']).toISOString().substring(0, 19).replace('T', ' ') }</b>
                            &nbsp;to <b>{new Date(trainingRange.current['endDate']).toISOString().substring(0, 19).replace('T', ' ') }</b>.
                            <Box float="right">
                                <Checkbox onChange = {( { detail }) => toggleAllSignals(detail.checked)} checked={allChecked}>
                                    Select all signals
                                </Checkbox>
                            </Box>
                        </Box>
                    </SpaceBetween>
                }
                onSelectionChange={ ({ detail }) => onSelectionChange(detail.selectedItems) }
                selectedItems={selectedItems}
                cardDefinition={{
                    header: e => e.name,
                    sections: [
                        { id: 'issues', header: 'Issues', content: e => e.issues },
                        { id: 'startTime', header: 'Start time', content: e => e.startTime, width: 50 },
                        { id: 'endTime', header: 'End time', content: e => e.endTime, width: 50 },
                        { 
                            id: 'chart', 
                            content: e => <Tabs
                                tabs={[
                                    {
                                        label: "Time series",
                                        id: "timeSeries",
                                        content: <ReactEcharts 
                                            option={e.chartOptions}
                                            theme="macarons"
                                            style={{height: 200, width: 550}}
                                            opts={{ renderer: 'svg' }}
                                        />
                                    },
                                    {
                                        label: "Histogram",
                                        content: <TimeSeriesHistograms
                                            data={data}
                                            ranges={[{start: rangeEnd + 1, end: x.length}]} 
                                            sensorName={e.name}
                                            height={200}
                                            width={600}
                                            hideTitle={true}
                                            hideAnimation={true}
                                            gridOptions={{top: 20, left: 50, right: 35, bottom: 45}}
                                            colors={['rgb(141, 152, 179, 0.3)', 'rgb(151, 181, 82, 0.7)']}
                                            legend={{top: 0, right: 40, orient: 'vertical'}}
                                            unselectedTitle={'Evaluation'}
                                            selectedTitle={'Training'}
                                        />
                                    }
                                ]}
                            />
                        }
                    ]
                }}
                cardsPerRow={[
                    { cards: 1 }, 
                    { minWidth: 800, cards: 2 }
                ]}
                items={cardItems}
                selectionType="multi"
                trackBy="name"
                filter={
                    <TextFilter 
                        filteringPlaceholder="Find signal" 
                        filteringText={filteringText}
                        onChange={({ detail }) => setFilteringText(detail.filteringText)}
                    />
                }
                pagination={
                    <Pagination 
                        currentPageIndex={currentPageIndex}
                        onChange={ ({ detail }) => setCurrentPageIndex(detail.currentPageIndex) }
                        pagesCount={numPages}
                    />
                }
            />
        )
    }
    else {
        <Spinner />
    }
}

export default ModelingSignalSelection