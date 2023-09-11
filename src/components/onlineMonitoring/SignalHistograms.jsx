// Imports:
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"

/*********************************************************************************************************************************************
 * ADD A NEW CONTEXT FOR ONLINE MONITORING???  *
 * IMPROVE PERFORMANCE, UI not reactive enough *
 * 
 * REFACTOR THIS COMPONENT (extract functions, signalHistogramCards, EmptyState... Shared with ModelingSignalSelection...
 *********************************************************************************************************************************************/

// Cloudscape components:
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Cards        from "@cloudscape-design/components/cards"
import Grid         from "@cloudscape-design/components/grid"
import Header       from "@cloudscape-design/components/header"
import Pagination   from "@cloudscape-design/components/pagination"
import Spinner      from "@cloudscape-design/components/spinner"
import TextFilter   from "@cloudscape-design/components/text-filter"

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'

// Utils
import { useCollection } from '@cloudscape-design/collection-hooks'
import { getAllTimeseriesWindow } from '../../utils/dataExtraction'
import { getMatchesCountText } from '../../utils/utils'
import { buildSignalBehaviorOptions, getSortedKeys } from './schedulerUtils.js'

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

// -----------------------------------------------------------------
// Component used to display the signal details in a Cards component
// -----------------------------------------------------------------
function SignalHistogramCards( {liveResults, trainingTimeseries} ) {
    const inferenceTimeseries = liveResults['timeseries']
    const tagsList = liveResults['tagsList']
    const anomalies = liveResults['anomalies']
    const sensorContribution = liveResults['sensorContribution']
    const samplingRate = liveResults['modelDetails']['samplingRate']

    const signalOptions = buildSignalBehaviorOptions(tagsList, trainingTimeseries, inferenceTimeseries, anomalies, sensorContribution, samplingRate)
    // let sortedKeys = getSortedKeys(tagsList, sensorContribution)

    let cardItems = []
    tagsList.forEach((tag) => {
        cardItems.push({
            name: tag,
            trainingChartOptions: signalOptions[tag]['trainingTimeSeries'],
            inferenceChartOptions: signalOptions[tag]['inferenceTimeSeries'],
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

    return (
        <Cards
            {...collectionProps}

            cardsPerRow={[{ cards: 1 }]}
            header={
                <Header
                    variant="h2"
                    /*info="To do"*/>
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
                            gridDefinition={[{ colspan: 4 }, { colspan: 4 }, { colspan: 4 }]}
                        >
                            <ReactEcharts 
                                option={e.trainingChartOptions}
                                theme="macarons"
                                style={{height: 280, width: "100%"}}
                                opts={{ renderer: 'svg' }}
                            />
                            <ReactEcharts 
                                option={e.inferenceChartOptions}
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

// --------------------------
// Component main entry point
// --------------------------
function SignalHistograms({ liveResults }) {
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { modelName, projectName } = useParams()
    const [ trainingTimeseries, setTrainingTimeseries ] = useState(undefined)

    useEffect(() => {
        getTrainingTimeseries(gateway, uid + '-' + projectName, modelName)
        .then((x) => setTrainingTimeseries(x))
    }, [gateway])

    console.log(trainingTimeseries)

    if (liveResults && trainingTimeseries) {
        return (
            <SignalHistogramCards liveResults={liveResults} trainingTimeseries={trainingTimeseries} />
        )
    }
    else {
        return (
            <Spinner />
        )
    }
}

async function getTrainingTimeseries(gateway, projectName, modelName) {
    const modelResponse = await gateway.lookoutEquipment.describeModel(modelName)

    const trainingStart = parseInt(new Date(modelResponse['TrainingDataStartTime']*1000).getTime() / 1000)
    const trainingEnd = parseInt(new Date(modelResponse['TrainingDataEndTime']*1000).getTime() / 1000)

    console.log(trainingStart, trainingEnd)

    const timeseries = await getAllTimeseriesWindow(gateway, projectName, trainingStart, trainingEnd, '1h')

    return timeseries
}

export default SignalHistograms