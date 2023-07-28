// Imports:
import { useContext, useEffect, useState } from 'react'

// CloudScape Components:
import Box       from "@cloudscape-design/components/box"
import PieChart from "@cloudscape-design/components/pie-chart"
import { colorChartsStatusPositive, colorChartsStatusHigh } from '@cloudscape-design/design-tokens'

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'

// Utils
import { getAnomalies } from './schedulerUtils'

const percentageFormatter = (value) => `${(value * 100).toFixed(0)}%`

// --------------------------
// Component main entry point
// --------------------------
function ConditionOverview({ range, modelName, projectName, size, hideTitles }) {
    const asset = `${projectName}|${modelName}`
    const { gateway } = useContext(ApiGatewayContext)
    const endTime = Date.now()
    const startTime = parseInt((endTime - range * 86400 * 1000) / 1000)

    const [ anomalies, setAnomalies ] = useState(undefined)

    useEffect(() => { 
        getAnomalies(gateway, asset, startTime, endTime)
        .then((x) => setAnomalies(x) )
    }, [gateway, range, modelName, projectName])

    // Renders the component:
    if (anomalies && anomalies['totalTime'] > 0) {
        const totalTime = anomalies['totalTime']
        const normalTime = anomalies['condition']['0']
        const abnormalTime = anomalies['condition']['1']

        return (
            <PieChart 
                hideFilter={true}
                hideLegend={true}
                hideTitles={hideTitles ? hideTitles : false}
                size={size ? size : 'large'}
                innerMetricDescription="health"
                innerMetricValue={percentageFormatter(normalTime / totalTime)}
                variant="donut"
                data={[
                    { title: 'Normal', value: normalTime, color: colorChartsStatusPositive },
                    { title: 'Abnormal', value: abnormalTime, color: colorChartsStatusHigh },
                ]}
                detailPopoverContent={(data, sum) => [
                    { key: 'Anomalies count', value: data.value },
                    { key: 'Percentage', value: percentageFormatter(data.value / sum) }
                    ]}
            />
        )
    }
    else {
        return (
            <PieChart 
                hideFilter={true}
                size={size ? size : 'small'}
                data={[]}
                empty={
                    <Box textAlign="center" color="inherit">
                        <b>No data available</b>
                        <Box variant="p" color="inherit">
                            There is no data available yet for this asset
                        </Box>
                    </Box>
                }
            />
        )
    }
}

export default ConditionOverview