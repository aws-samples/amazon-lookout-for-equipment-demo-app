// Imports:
import { useContext } from 'react'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"

// Cloudscape components:
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Cards        from "@cloudscape-design/components/cards"
import Grid         from "@cloudscape-design/components/grid"
import Header       from "@cloudscape-design/components/header"
import Link         from "@cloudscape-design/components/link"
import Pagination   from "@cloudscape-design/components/pagination"
import TextFilter   from "@cloudscape-design/components/text-filter"

// Utils
import { useCollection } from '@cloudscape-design/collection-hooks'
import { getMatchesCountText } from '../../utils/utils'
import { buildSignalBehaviorOptions } from './schedulerUtils.js'

// Contexts:
import HelpPanelContext from '../contexts/HelpPanelContext'

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
function SignalHistogramCards({ liveResults, trainingTimeseries }) {
    const { setHelpPanelOpen } = useContext(HelpPanelContext)

    const inferenceTimeseries = liveResults['timeseries']
    const tagsList = liveResults['tagsList']
    const anomalies = liveResults['anomalies']
    const sensorContribution = liveResults['sensorContribution']
    const samplingRate = liveResults['modelDetails']['samplingRate']

    const signalOptions = buildSignalBehaviorOptions(tagsList, trainingTimeseries, inferenceTimeseries, anomalies, sensorContribution, samplingRate)

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
                    info={<Link variant="info" onFollow={() => setHelpPanelOpen({
                        status: true,
                        page: 'onlineResults',
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

export default SignalHistogramCards