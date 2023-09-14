// Imports:
import { useContext } from 'react'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"


// Utils:
import { buildLiveDetectedEventsOptions } from './schedulerUtils'

// CloudScape Components:
import Alert            from "@cloudscape-design/components/alert"
import SpaceBetween     from "@cloudscape-design/components/space-between"
import Spinner          from "@cloudscape-design/components/spinner"

// Contexts:
import HelpPanelContext from '../contexts/HelpPanelContext'

function DetectedEvents({ range, infoLink, liveResults }) {
    const endTime = parseInt(Date.now() / 1000)
    const startTime = parseInt((endTime - range * 86400))

    if (liveResults && liveResults['modelDetails']['status'] === 'SUCCESS') {
        const timeseries = liveResults['timeseries']
        const sensorContribution = liveResults['sensorContribution']
        const tagsList = liveResults['tagsList']
        const anomalies = liveResults['anomalies']
        const rawAnomalies = liveResults['rawAnomalies']
        const samplingRate = liveResults['modelDetails']['samplingRate']

        const showTopN = 5
        const options = buildLiveDetectedEventsOptions(
            tagsList,
            timeseries,
            sensorContribution,
            anomalies,
            rawAnomalies,
            samplingRate,
            startTime, 
            endTime,
            showTopN
        )

        return (
            <SpaceBetween size="xl">
                <Alert>
                    This section shows the detection results of your model when applied on live data. To 
                    learn more about how to interpret these plots, click on the <b>{infoLink}</b> link above.
                </Alert>
                <ReactEcharts 
                    option={options}
                    notMerge={true}
                    theme="macarons"
                    style={{height: 900, width: "100%"}}
                />
            </SpaceBetween>
        )
    }
    else {
        return (
            <Spinner />
        )
    }
}

export default DetectedEvents