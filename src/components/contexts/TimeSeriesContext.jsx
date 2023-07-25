// Imports:
import { createContext, useContext } from 'react'
import { useQuery } from 'react-query'
import { getAllTimeseries } from '../../utils/dataExtraction.js'
import ApiGatewayContext from './ApiGatewayContext'
import Alert from "@cloudscape-design/components/alert"
import Spinner from "@cloudscape-design/components/spinner"
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
    const { gateway } = useContext(ApiGatewayContext)

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
    const getTimestamps = () => {
        let x_signals = []

        if (data.timeseries) {
            data.timeseries.Items.forEach((item) => {
                let current_date = new Date(item['timestamp']['S']).getTime()
                current_date = current_date - new Date().getTimezoneOffset()*30*1000
                current_date = new Date(current_date).toISOString().substring(0, 19).replace('T', '\n');
                x_signals.push(current_date)
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
                    y_signals[tag].push(parseFloat(item[tag]['S']))
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
    const { data, status } = useQuery(["timeseries", gateway, projectName], fetchTimeseries)
    
    if (status === 'success') {
        const tagsList = getTagsList()

        return (
            <TimeSeriesContext.Provider value={{
                data: data,
                tagsList: tagsList,
                x: getTimestamps(),
                signals: getSignalData(tagsList),
                queryStatus: 'success'
            }}>
                {children}
            </TimeSeriesContext.Provider>
        )
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