// Imports:
import { useContext, useEffect, useState } from 'react'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"
import { colorPalette } from "../../styles/chartThemeMacarons.js"

import Alert from "@cloudscape-design/components/alert"

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'

// Utils
import { getAssetCondition } from './schedulerUtils'

const percentageFormatter = (value) => `${(value * 100).toFixed(0)}%`

// --------------------------
// Component main entry point
// --------------------------
function ConditionOverview({ range, modelName, projectName, height }) {
    const { gateway, uid } = useContext(ApiGatewayContext)
    const asset = `${uid}-${projectName}-${modelName}`
    const endTime = Date.now()
    const startTime = endTime - range * 86400 * 1000
    const [ anomalies, setAnomalies ] = useState(undefined)

    useEffect(() => { 
        getAssetCondition(gateway, asset, parseInt(startTime / 1000), parseInt(endTime / 1000), uid + '-' + projectName)
        .then((x) => setAnomalies(x) )
    }, [gateway, range, modelName, projectName])

    if (anomalies && anomalies['totalTime'] > 0) {
        // Build the eChart configuration for this component:
        const { totalTime, normalTime, abnormalTime } = buildConditionOverviewData(anomalies)
        const chartOptions = buildConditionOverviewChart(modelName, totalTime, normalTime, abnormalTime, height)

        // Renders the component:
        return (
            <ReactEcharts 
                option={chartOptions}
                notMerge={true}
                theme="macarons"
                style={{height: height, width: "100%"}}
            />
        )
    }
    else {
        return (
            <Alert type="warning">
                No live data available. If this model was recently deployed, it may have not been running for long enough.
                Refresh this screen in a few minute to visualize your asset health. This model may also have not received
                any new data to analyze in the past {range} day{range > 1 ? 's' : ''}. In this case, check that your live
                data pipeline is still running correctly.
            </Alert>
        )
    }
}

function buildConditionOverviewChart(modelName, totalTime, normalTime, abnormalTime, height) {
    let data = [
        {
            value: normalTime, 
            name: "Normal", 
            itemStyle: { color: colorPalette[2] },
            label: { show: normalTime > 0, fontSize: 16  }
        },
        {
            value: abnormalTime, 
            name: "Abnormal", 
            itemStyle: { color: colorPalette[1] },
            label: { show: abnormalTime > 0, fontSize: 16 }
        },

        // Stop the chart from rendering this piece to define a half-donut:
        {
            value: totalTime,
            itemStyle: { color: 'none' },
            label: { show: false }
        }
    ]

    const options = {
        title: [
            { text: modelName, top: height - 60, left: "50%", textStyle: {fontSize: 24}, textAlign: 'center' },
            {
                text: `Healthy condition: ${percentageFormatter(normalTime / totalTime)}`,
                top: height - 30,
                left: "50%",
                textStyle: {fontSize: 16, color: '#999'},
                textAlign: 'center'
            }
        ],
        // backgroundColor: '#EEE',
        series: [{
            top: 30, bottom: -height,
            name: 'Condition overview',
            type: 'pie',
            radius: ['70%', '100%'],
            startAngle: 180,
            data : data
        }]
    }

    return options
}

function buildConditionOverviewData(anomalies) {
    let totalTime = 1.0
    let normalTime = 1.0
    let abnormalTime = 0.0

    if (anomalies && anomalies['totalTime'] > 0) {
        totalTime = anomalies['totalTime']
        normalTime = anomalies['condition']['0']
        abnormalTime = anomalies['condition']['1']
    }

    return {
        totalTime: totalTime,
        normalTime: normalTime,
        abnormalTime: abnormalTime
    }
}

export default ConditionOverview