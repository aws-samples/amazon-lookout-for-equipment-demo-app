// Imports:
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// CloudScape Components:
import Box       from "@cloudscape-design/components/box"
import LineChart from "@cloudscape-design/components/line-chart"
import { colorChartsStatusHigh } from '@cloudscape-design/design-tokens'

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'

// Utils
import { getAnomalyScores } from './schedulerUtils'

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