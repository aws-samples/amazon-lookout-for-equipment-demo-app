// Imports:
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// CloudScape Components:
import Box       from "@cloudscape-design/components/box"
import AreaChart from "@cloudscape-design/components/area-chart"

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'

// Utils
import { getSensorContribution } from './schedulerUtils'

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
                            There is no data available: either the scheduler has not been running for long enough, or no anomalies were detected in the selected time range
                        </Box>
                    </Box>
                }
            />
        )
    }
}

export default SensorContribution