// Imports:
import { useEffect, useState } from 'react'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"

// Cloudscape components:
import DatePicker from "@cloudscape-design/components/date-picker"
import FormField  from "@cloudscape-design/components/form-field"
import Spinner from "@cloudscape-design/components/spinner"

// Utils:
import { getModelDetails } from '../../utils/dataExtraction'
import { buildTimeseries } from '../../utils/timeseries.js'
import { getIndex } from '../../utils/utils'

// ------------------------------------------------------
// Replay data start date selection component entry point
// ------------------------------------------------------
function StartDateSelection({ projectName, modelName, gateway, replayDuration, disabled, setParentReplayStartDate }) {
    const [ replayStartDate, setReplayStartDate ] = useState(undefined)
    const [ modelDetails, setModelDetails ] = useState(undefined)
    let options = undefined

    useEffect(() => {
        getModelDetails(gateway, modelName, projectName)
        .then((x) => {
            setModelDetails(x)
            setReplayStartDate(x['evaluationStart'])
        })
    }, [gateway, modelName, projectName])

    // As soon as we get the model details we show the component:
    if (modelDetails) {
        const anomalies = modelDetails['anomalies']
        const results = buildTimeseries(anomalies.Items, 'anomaly')
        const replayStartTimestamp = new Date(replayStartDate)
        const replayStartIndex = getIndex(results['x'], replayStartTimestamp)
        const evaluationStartTimestamp = new Date(modelDetails['evaluationStart'])
        const evaluationStartIndex= getIndex(results['x'], evaluationStartTimestamp)

        // Send the replay start date back to the parent component (the 
        // modal window where the model deploymend is configured):
        setParentReplayStartDate(replayStartDate)

        // Computes the replay end index based on the
        // start date and the desired replay length:
        let replayEndTimestamp = undefined
        switch (replayDuration) {
            case '1day':
                replayEndTimestamp = new Date(replayStartTimestamp.getTime() + 1 * 86400 * 1000)
                break
            case '1week':
                replayEndTimestamp = new Date(replayStartTimestamp.getTime() + 7 * 86400 * 1000)
                break
            case '1month':
                replayEndTimestamp = new Date(replayStartTimestamp.getTime() + 30 * 86400 * 1000)
                break
        }
        const replayEndIndex = getIndex(results['x'], replayEndTimestamp)

        // The options for the eChart component:
        options = {
            grid: [{ left: 30, right: 30, top: 20, height: 30 }],
            xAxis: [{ type: 'category', data: results['x'], show: true, min: evaluationStartIndex }],
            yAxis: [{ show: false }],
            series: [{
                symbol: 'none',
                data: results['y'],
                type: 'line',
                lineStyle: {
                    color: "#d87a80",
                    opacity: 0.5,
                    shadowColor: 'rgba(0, 0, 0, 0.2)',
                    shadowBlur: 5,
                    width: 0.5
                },
                areaStyle: { color: '#d87a80', opacity: 0.1 },
                markArea: {
                    itemStyle: { color: 'rgb(151, 181, 82, 0.3)' },
                    data: [[
                        { name: 'Replay range', xAxis: replayStartIndex },
                        { xAxis: replayEndIndex }
                    ]]
                }
            }],
            animation: false,
            tooltip: {
                axisPointer: {
                    type: 'cross',
                    label: { backgroundColor: '#6a7985' }
                }
            }
        }
    }

    // Renders the component:
    return (
        <FormField label="Replay start date" description="When do you want the replay data to start?">
            { modelDetails && <>
                    <DatePicker 
                        onChange={({ detail }) => setReplayStartDate(detail.value)}
                        value={replayStartDate}
                        disabled={disabled}
                    />

                    <ReactEcharts 
                        option={options}
                        notMerge={true}
                        theme="macarons"
                        style={{height: 80, width: "100%"}}
                    />
                </>
            }

            { !modelDetails && <Spinner /> }
        </FormField>
    )
}

export default StartDateSelection