// Imports:
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { cleanList } from '../../utils/utils'

// CloudScape Components:
import Box       from "@cloudscape-design/components/box"
import AreaChart from "@cloudscape-design/components/area-chart"

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'

// ---------------------------------------
// Build a data structure that can be 
// directly fed to the LineChart component
// ---------------------------------------
function buildSensorContributionSeries(items) {
    const tagsList = cleanList(['model', 'timestamp'], Object.keys(items[0]))
    let data = {}

    items.forEach((item) => {
        tagsList.forEach((tag) => {
            if (!data[tag]) { data[tag] = [] }
            data[tag].push({
                x: new Date(parseInt(item['timestamp']['N'])*1000),
                y: parseFloat(item[tag]['N'])
            })
        })
    })

    return data
}

// ---------------------------------------------------
// This function gets the raw anomaly scores generated
// by a given model between a range of time
// ---------------------------------------------------
async function getSensorContribution(gateway, asset, table, startTime, endTime) {
    const anomalyScoreQuery = { 
        TableName: table,
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

    let sensorContribution = await gateway
        .dynamoDbQuery(anomalyScoreQuery)
        .catch((error) => console.log(error.response))

    // If the payload is too large (> 1 MB), the API will paginate
    // the output. Let's collect all the data we need to cover the 
    // range requested by the user:
    if (sensorContribution.Items.length > 0) {
        let currentSensorContribution = undefined
        if (sensorContribution.LastEvaluatedKey) {
            let lastEvaluatedKey = sensorContribution.LastEvaluatedKey

            do {
                currentSensorContribution = await gateway
                    .dynamoDbQuery({...anomalyScoreQuery, ExclusiveStartKey: lastEvaluatedKey})
                    .catch((error) => console.log(error.response))

                if (currentSensorContribution.LastEvaluatedKey) {
                    lastEvaluatedKey = currentSensorContribution.LastEvaluatedKey
                }
                sensorContribution.Items = [...sensorContribution.Items, ...currentSensorContribution.Items]

            } while (currentSensorContribution.LastEvaluatedKey)
        }

        return buildSensorContributionSeries(sensorContribution.Items)
    }
    
    return undefined
}

function SensorContribution({ range }) {
    const { modelName, projectName } = useParams()
    const asset = `${projectName}|${modelName}`
    const { gateway } = useContext(ApiGatewayContext)
    const endTime = Date.now() / 1000
    const startTime = parseInt(endTime - range * 86400)

    const [ sensorContribution, setSensorContribution ] = useState(undefined)

    useEffect(() => { 
        getSensorContribution(gateway, asset, `l4edemoapp-${projectName}-sensor_contribution`, startTime, endTime)
        .then((x) => setSensorContribution(x) )
    }, [gateway, range, modelName, projectName])

    // Rendering the component:
    if (sensorContribution) {
        let series = []
        const tagsList = Object.keys(sensorContribution)

        tagsList.forEach((tag) => {
            series.push({
                title: tag,
                type: "area",
                data: sensorContribution[tag]
            })
        })
        
        return (
            <AreaChart
                height={300}
                series={series}
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
            <AreaChart
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

export default SensorContribution