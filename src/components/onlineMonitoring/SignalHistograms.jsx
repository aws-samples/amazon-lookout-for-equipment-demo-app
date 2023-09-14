// Imports:
import { useContext } from 'react'
import "../../styles/chartThemeMacarons.js"

// Cloudscape components:
import SignalHistogramCards from './SignalHistogramCards'
import Spinner from "@cloudscape-design/components/spinner"

// Contexts:
import OnlineMonitoringContext from '../contexts/OnlineMonitoringContext'

// --------------------------
// Component main entry point
// --------------------------
function SignalHistograms() {
    const { liveResults, trainingTimeseries } = useContext(OnlineMonitoringContext)

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