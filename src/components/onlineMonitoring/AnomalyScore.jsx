// Imports:
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// CloudScape Components:
import Box       from "@cloudscape-design/components/box"
import LineChart from "@cloudscape-design/components/line-chart"
import { colorChartsStatusHigh } from '@cloudscape-design/design-tokens'

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'

// ---------------------------------------
// Build a data structure that can be 
// directly fed to the LineChart component
// ---------------------------------------
export function buildAnomalyScoreSeries(items) {
    let data = []

    items.forEach((item) => {
        data.push({
            x: new Date(parseInt(item['timestamp']['N'])*1000),
            y: parseFloat(item['anomaly_score']['N'])
        })
    })

    return data
}

// ---------------------------------------------------
// This function gets the raw anomaly scores generated
// by a given model between a range of time
// ---------------------------------------------------
async function getAnomalyScores(gateway, asset, startTime, endTime) {
    const anomalyScoreQuery = { 
        TableName: 'l4edemoapp-raw-anomalies',
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

    let anomalyScores = await gateway
        .dynamoDbQuery(anomalyScoreQuery)
        .catch((error) => console.log(error.response))

    // If the payload is too large (> 1 MB), the API will paginate
    // the output. Let's collect all the data we need to cover the 
    // range requested by the user:
    if (anomalyScores.Items.length > 0) {
        let currentAnomalyScores = undefined
        if (anomalyScores.LastEvaluatedKey) {
            let lastEvaluatedKey = anomalyScores.LastEvaluatedKey

            do {
                currentAnomalyScores = await gateway
                    .dynamoDbQuery({...anomalyScoreQuery, ExclusiveStartKey: lastEvaluatedKey})
                    .catch((error) => console.log(error.response))

                if (currentAnomalyScores.LastEvaluatedKey) {
                    lastEvaluatedKey = currentAnomalyScores.LastEvaluatedKey
                }
                anomalyScores.Items = [...anomalyScores.Items, ...currentAnomalyScores.Items]

            } while (currentAnomalyScores.LastEvaluatedKey)
        }

        return buildAnomalyScoreSeries(anomalyScores.Items)
    }
    
    return undefined
}

// --------------------------
// Component main entry point
// --------------------------
function AnomalyScore({ range }) {
    const { modelName, projectName } = useParams()
    const asset = `${projectName}|${modelName}`
    const { gateway } = useContext(ApiGatewayContext)
    const endTime = Date.now() / 1000
    const startTime = parseInt(endTime - range * 86400)

    const [ anomalyScores, setAnomalyScores ] = useState([])

    useEffect(() => { 
        getAnomalyScores(gateway, asset, startTime, endTime)
        .then((x) => setAnomalyScores(x) )
    }, [gateway, range, modelName, projectName])

    // Rendering the component:
    if (anomalyScores) {
        return (
            <LineChart
                height={200}
                hideFilter
                hideLegend
                series={[
                    {
                        title: `Anomaly score`,
                        type: "line",
                        data: anomalyScores,
                        color: colorChartsStatusHigh
                    },
                    {
                        title: "Anomaly threshold",
                        type: "threshold",
                        y: 0.5
                    }
                ]}
                yDomain={[0.0, 1.0]}
                xDomain={[new Date(startTime * 1000), new Date(endTime * 1000)]}
                xScaleType="time"
                i18nStrings={{
                    xTickFormatter: e => e.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            hour12: !1
                        }
                    ).split(",").join("\n")
                }}
            />
        )
    }
    else {
        return (
            <LineChart
                height={100}
                hideFilter
                hideLegend
                series={[]}
                empty={
                    <Box textAlign="center" color="inherit">
                        <b>No data available</b>
                        <Box variant="p" color="inherit">
                            There is no data available
                        </Box>
                    </Box>
                }
            />
        )
    }
}

export default AnomalyScore