/*********************************************************************************************************************************************
 * ADD A NEW CONTEXT FOR ONLINE MONITORING???  *
 * IMPROVE PERFORMANCE, UI not reactive enough *
 *********************************************************************************************************************************************/

// Imports:
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import "../../styles/chartThemeMacarons.js"
import SignalHistogramCards from './SignalHistogramCards'
import Spinner      from "@cloudscape-design/components/spinner"
import ApiGatewayContext from '../contexts/ApiGatewayContext'
import { getAllTimeseriesWindow } from '../../utils/dataExtraction'

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

export default SignalHistograms