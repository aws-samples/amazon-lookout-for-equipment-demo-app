// Imports:
import { createContext, useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// Context:
import ApiGatewayContext from './ApiGatewayContext'

// Utils:
import { getLiveResults } from '../onlineMonitoring/schedulerUtils'
import { getAllTimeseriesWindow } from '../../utils/dataExtraction'

const OnlineMonitoringContext = createContext()

// ==========================================
// Online monitoring data provider definition
// ==========================================
export const OnlineMonitoringProvider = ({ children, range }) => {
    const [ liveResults, setLiveResults ] = useState(undefined)
    const [ trainingTimeseries, setTrainingTimeseries ] = useState(undefined)
    const { projectName, modelName } = useParams()
    const { gateway, uid } = useContext(ApiGatewayContext)
    const endTime = parseInt(Date.now() / 1000)
    const startTime = parseInt((endTime - range * 86400))

    // Loads training time series data and live 
    // data processed by the current model
    useEffect(() => {
        loadLiveData(gateway, uid, projectName, modelName, startTime, endTime)
        .then((x) => {
            setLiveResults(x[0])
            setTrainingTimeseries(x[1])
        })
    }, [gateway, modelName, projectName, range])

    // Renders the provider and its children:
    return (
        <OnlineMonitoringContext.Provider value={{
            startTime,
            endTime,
            liveResults,
            trainingTimeseries
        }}>
            {children}
        </OnlineMonitoringContext.Provider>
    )
}

// ----------------------------------------
// Loads live data and training time series
// ----------------------------------------
async function loadLiveData(gateway, uid, projectName, modelName, startTime, endTime) {
    const liveResults = getLiveResults(gateway, uid, projectName, modelName, startTime, endTime)
    const timeseries = getTrainingTimeseries(gateway, uid + '-' + projectName, `${uid}-${projectName}-${modelName}`)

    return await Promise.all([liveResults, timeseries])
}


// ---------------------------------------------
// This function extract the signal time series
// over the training period of the current model
// ---------------------------------------------
async function getTrainingTimeseries(gateway, projectName, modelName) {
    const modelResponse = await gateway.lookoutEquipment.describeModel(modelName)

    const timeseries = await getAllTimeseriesWindow(
        gateway, 
        projectName, 
        modelResponse['TrainingDataStartTime'], 
        modelResponse['TrainingDataEndTime'], 
        '1h'
    )

    return timeseries
}

export default OnlineMonitoringContext