// Imports:
import { createContext, useContext } from 'react'
import { useQuery } from 'react-query'

// Utils:
import { getAllTimeseries } from '../../utils/dataExtraction.js'

// Cloudscape components:
import Alert from "@cloudscape-design/components/alert"
import Container from "@cloudscape-design/components/container"
import Header from "@cloudscape-design/components/header"
import Spinner from "@cloudscape-design/components/spinner"

// Context:
import ApiGatewayContext from './ApiGatewayContext'

const TimeSeriesContext = createContext()

// -----------------------------------------------------------
// Query to fetch all the time series from the current project
// -----------------------------------------------------------
const fetchTimeseries = async ({ queryKey }) => {
    const [_, gateway, projectName] = queryKey
    const data = getAllTimeseries(gateway, projectName)

    return data
}

// ========================
// Time provider definition
// ========================
export const TimeSeriesProvider = ({children, projectName}) => {
    const { gateway, uid } = useContext(ApiGatewayContext)

    // ---------------------------------------------------
    // Provides a clean tags list from the current dataset
    // ---------------------------------------------------
    const getTagsList = () => {
        if (data.tagsList) {
            let newTagsList = [...data.tagsList]
            const tagsToRemove = ['asset', 'sampling_rate', 'timestamp', 'unix_timestamp']
            tagsToRemove.forEach((tag) => {
                const index = newTagsList.indexOf(tag)
                const removed = newTagsList.splice(index, 1)
            })

            return newTagsList
        }
        else {
            return undefined
        }
    }

    // --------------------------------------------------
    // Extract the x-axis tick labels for the time series
    // --------------------------------------------------
    const getTimestamps = (firstTag) => {
        let x_signals = []

        if (data.timeseries) {
            data.timeseries.Items.forEach((item) => {
                // We only collect timestamps for which we have some tag value:
                if (item[firstTag]) {
                    let current_date = new Date(item['timestamp']['S']).getTime()
                    current_date = current_date - new Date().getTimezoneOffset()*30*1000
                    current_date = new Date(current_date).toISOString().substring(0, 19).replace('T', '\n');
                    x_signals.push(current_date)
                }
            })

            return x_signals
        }
        else {
            return undefined
        }
    }

    // ---------------------------------------------------
    // Building the y data to feed the time series dataset
    // ---------------------------------------------------
    const getSignalData = (tagsList) => {
        let y_signals = {}

        if (data.timeseries) {
            data.timeseries.Items.forEach((item) => {
                tagsList.forEach((tag) => {
                    if (!y_signals[tag]) { y_signals[tag] = [] }
                    if (item[tag]) {
                        try {
                            y_signals[tag].push(parseFloat(item[tag]['S']))
                        }
                        catch (e) {
                            console.log(item)
                            throw(e)
                        }
                    }
                })
            })
        }
        else {
            return undefined
        }

        return y_signals
    }

    // ---------------------------
    // Context provider definition
    // ---------------------------
    // Loads the time series data
    const { data, status } = useQuery(["timeseries", gateway, uid + '-' + projectName], fetchTimeseries)

    if (status === 'success') {
        const tagsList = getTagsList()

        return (
            <TimeSeriesContext.Provider value={{
                data: data,
                tagsList: tagsList,
                x: getTimestamps(tagsList[0]),
                signals: getSignalData(tagsList),
                queryStatus: 'success'
            }}>
                {children}
            </TimeSeriesContext.Provider>
        )
    }
    else if (status === 'error') {
        <TimeSeriesContext.Provider value={{data: undefined, queryStatus: 'error'}}>
            <Container header={<Header variant="h1">Summary</Header>}>
                <Alert header="Data preparation in progress">
                    Data preparation and ingestion in the app still in progress: after uploading your
                    dataset, the app prepares it to optimize visualization speed. This step usually takes
                    10 to 20 minutes depending on the size of the dataset you uploaded.
                </Alert>
            </Container>
        </TimeSeriesContext.Provider>
    }
    else {
        return (
            <TimeSeriesContext.Provider value={{data: undefined, queryStatus: 'loading'}}>
                <Spinner />
            </TimeSeriesContext.Provider>
        )
    }
}

export default TimeSeriesContext