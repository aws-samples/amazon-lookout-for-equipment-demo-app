// Imports:
import { useContext, useEffect, useState } from 'react'

// CloudScape Components:
import Box       from "@cloudscape-design/components/box"
import PieChart from "@cloudscape-design/components/pie-chart"
import { colorChartsStatusPositive, colorChartsStatusHigh } from '@cloudscape-design/design-tokens'

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'

const percentageFormatter = (value) => `${(value * 100).toFixed(0)}%`

// ------------------------------------------------
// This function gets the anomalous events detected
// by a given model between a range of time
// ------------------------------------------------
async function getAnomalies(gateway, asset, startTime, endTime) {
    const anomaliesQuery = { 
        TableName: 'l4edemoapp-anomalies',
        KeyConditionExpression: "#model = :model AND #timestamp BETWEEN :startTime AND :endTime",
        ExpressionAttributeNames: {
            "#model": "model",
            "#timestamp": "timestamp"
        },
        ExpressionAttributeValues: {
             ":model": {"S": asset},
             ":startTime": {"N": startTime.toString() },
             ":endTime": {"N": endTime.toString() }
        }
    }

    let anomalies = await gateway
        .dynamoDbQuery(anomaliesQuery)
        .catch((error) => console.log(error.response))

    if (anomalies.Items.length > 0) {
        let currentAnomalies = undefined
        if (anomalies.LastEvaluatedKey) {
            let lastEvaluatedKey = anomalies.LastEvaluatedKey

            do {
                currentAnomalies = await gateway
                    .dynamoDbQuery({...anomaliesQuery, ExclusiveStartKey: lastEvaluatedKey})
                    .catch((error) => console.log(error.response))

                if (currentAnomalies.LastEvaluatedKey) {
                    lastEvaluatedKey = currentAnomalies.LastEvaluatedKey
                }
                anomalies.Items = [...anomalies.Items, ...currentAnomalies.Items]

            } while (currentAnomalies.LastEvaluatedKey)
        }

        let condition = { '0': 0.0, '1': 0.0 }
        let totalTime = 0.0
        anomalies.Items.forEach((item, index) => {
            if (index > 0) {
                const previousTimestamp = parseFloat(anomalies.Items[index - 1]['timestamp']['N'])
                const currentTimestamp = parseFloat(item['timestamp']['N'])
                const duration = currentTimestamp - previousTimestamp

                condition[item['anomaly']['N']] += duration
                totalTime += duration
            }
            
        })

        return {totalTime, condition}
    }

    return undefined
}

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

    console.log('anomalies:', anomalies)

    // Renders the component:
    if (anomalies) {
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