// Imports:
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
import Badge        from "@cloudscape-design/components/badge"
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Cards        from "@cloudscape-design/components/cards"
import Checkbox     from "@cloudscape-design/components/checkbox"
import Header       from "@cloudscape-design/components/header"
import Pagination   from "@cloudscape-design/components/pagination"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Spinner      from "@cloudscape-design/components/spinner"
import Tabs         from "@cloudscape-design/components/tabs"
import TextFilter   from "@cloudscape-design/components/text-filter"

// App components:
import { getSignalDetails } from '../../utils/dataExtraction'
import TimeSeriesHistograms from '../charts/TimeSeriesHistogram.jsx'

// Contexts:
import TimeSeriesContext from '../contexts/TimeSeriesContext'
import ApiGatewayContext from '../contexts/ApiGatewayContext'
import ModelParametersContext from '../contexts/ModelParametersContext'

// Utils
import { getSignalsStatistics, buildChartOptions } from './signalSelectionUtils'
import { useCollection } from '@cloudscape-design/collection-hooks'

// -------------------------------------------------------
// Component to show when the filter ends up with 0 result
// -------------------------------------------------------
function EmptyState({ title, subtitle, action }) {
    return (
        <Box textAlign="center" color="inherit">
            <Box variant="strong" textAlign="center" color="inherit">
                {title}
            </Box>

            <Box variant="p" padding={{ bottom: 's' }} color="inherit">
                {subtitle}
            </Box>

            {action}
        </Box>
    )
}

// -------------------------------------------------------
// Return number of matches found when filtering as a text
// -------------------------------------------------------
function getMatchesCountText(count) {
    return count === 1 ? '1 match' : `${count} matches`
}

function SignalSelectionCards({ cardItems, selectedItems, tagsList, trainingRange, allChecked, data, rangeEnd, x, toggleAllSignals, onSelectionChange }) {
    // Add sorting, filtering and pagination to the table:
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
            pagination: { pageSize: 10 }
        }
    )

    return (
        <Cards
            {...collectionProps}
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
                                        colors={['rgb(82, 156, 203, 0.5)', 'rgb(151, 181, 82, 0.5)']}
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
            items={items}
            selectionType="multi"
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

// =================================
// Main entry point of the component
// =================================
function ModelingSignalSelection() {
    const { projectName } = useParams()
    const { data, tagsList, x, signals } = useContext(TimeSeriesContext)
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { trainingRange, evaluationRange, selectedItems, allChecked } = useContext(ModelParametersContext)
    const { setSelectedItems, setAllChecked } = useContext(ModelParametersContext)
    const [ signalDetails, setSignalDetails ] = useState(undefined)

    // Extract the details of the signals to be displayed:
    useEffect(() => {
        getSignalDetails(gateway, uid + '-' + projectName)
        .then((x) => { 
            setSignalDetails(x)
            toggleAllSignals(allChecked)
        })
    }, [gateway])

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
        const output = getSignalsStatistics(signalDetails)
        const signalInfos = output['signalInfos']
        const signalAttributes = output['signalAttributes']
        const signalOptions = buildChartOptions(tagsList, x, signals, trainingRange, evaluationRange)
        
        let cardItems = []
        tagsList.forEach((tag) => {
            cardItems.push({
                name: tag,
                issues: signalInfos[tag].length === 0
                    ? <Badge color="green">None</Badge> 
                    : <SpaceBetween size="xxs" direction="horizontal">{signalInfos[tag].map((issue) => issue)}</SpaceBetween>,
                startTime: signalAttributes[tag]['startTime'],
                endTime: signalAttributes[tag]['endTime'],
                chartOptions: signalOptions[tag]
            })
        })

        const rangeEnd = parseInt((new Date(trainingRange.current['endDate']) - new Date(x[0])) / (new Date(x[x.length - 1]) - new Date(x[0])) * x.length)

        return (
            <SignalSelectionCards 
                cardItems={cardItems} 
                selectedItems={selectedItems} 
                tagsList={tagsList} 
                trainingRange={trainingRange} 
                allChecked={allChecked} 
                data={data} 
                rangeEnd={rangeEnd}
                x={x}
                toggleAllSignals={toggleAllSignals}
                onSelectionChange={(newSelection) => { setSelectedItems(newSelection) }}
            />
        )
    }
    else {
        <Spinner />
    }
}

export default ModelingSignalSelection