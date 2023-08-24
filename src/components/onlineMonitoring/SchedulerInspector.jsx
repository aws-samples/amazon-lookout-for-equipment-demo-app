// Imports:
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// Context:
import ApiGatewayContext from '../contexts/ApiGatewayContext'

// CloudScape components:
import Badge                from "@cloudscape-design/components/badge"
import Box                  from "@cloudscape-design/components/box"
import Button               from "@cloudscape-design/components/button"
import ColumnLayout         from "@cloudscape-design/components/column-layout"
import Popover              from "@cloudscape-design/components/popover"
import SpaceBetween         from "@cloudscape-design/components/space-between"
import StatusIndicator      from "@cloudscape-design/components/status-indicator"
import Textarea             from "@cloudscape-design/components/textarea"

// Utils:
import { getSchedulerDetails } from './schedulerUtils'

// --------------------------
// Component main entry point
// --------------------------
function SchedulerInspector() {
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { modelName, projectName } = useParams()
    const [ schedulerDetails, setSchedulerDetails ] = useState(undefined)

    useEffect(() => {
        getSchedulerDetails(gateway, modelName, uid, projectName)
        .then((x) => setSchedulerDetails(x))
    }, [gateway, modelName])

    // Renders the component:
    if (schedulerDetails) {
        return (
            <ColumnLayout columns={3} variant="text-grid">
                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Scheduler status</Box>
                        <div>{<Badge color={schedulerDetails['statusColor']}>{schedulerDetails['status']}</Badge>}</div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Frequency</Box>
                        <div>Runs every <b>{schedulerDetails['frequency']} minutes</b></div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Delayed execution</Box>
                        {schedulerDetails['delay'] > 0 && <div>Scheduler will wait for up to <b>{schedulerDetails['delay']} minutes</b> for the data to be available</div>}
                        {!schedulerDetails['delay'] > 0 && <div>No delay configured</div>}
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Next run</Box>
                        <div>
                            The current time is <b>{schedulerDetails['currentTime']}</b>.<br />
                            Next scheduler run will be at <b>{schedulerDetails['nextExecutionTime']}</b>
                        </div>
                    </div>
                </SpaceBetween>

                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Input location</Box>
                        <div>
                            <Popover
                                size="medium"
                                position="top"
                                triggerType="custom"
                                dismissButton={false}
                                content={<StatusIndicator type="success">S3 input location copied</StatusIndicator>}
                            >
                                <Button
                                    variant="inline-icon"
                                    iconName="copy"
                                    onClick={() => { navigator.clipboard.writeText(schedulerDetails['inputLocation']) }}
                                />
                            </Popover>
                            {schedulerDetails['inputLocation']}
                        </div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Output location</Box>
                        <div>
                            <Popover
                                size="medium"
                                position="top"
                                triggerType="custom"
                                dismissButton={false}
                                content={<StatusIndicator type="success">S3 input location copied</StatusIndicator>}
                            >
                                <Button
                                    variant="inline-icon"
                                    iconName="copy"
                                    onClick={() => { navigator.clipboard.writeText(schedulerDetails['outputLocation']) }}
                                />
                            </Popover>
                            {schedulerDetails['outputLocation']}
                        </div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Expected input filename</Box>
                        <div>{
                            modelName.slice(projectName.length + 1) + 
                            schedulerDetails['delimiter'] + 
                            schedulerDetails['nextTimestamp'] + 
                            '.csv'
                        }</div>
                    </div>
                </SpaceBetween>

                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Expected content</Box>
                        <SpaceBetween size="xs">
                            The input file content must have the following columns:

                            <Textarea
                                value={schedulerDetails['expectedContent']}
                                disabled={true}
                                rows="10"
                            />
                        </SpaceBetween>
                    </div>
                </SpaceBetween>
            </ColumnLayout>
        )
    }
}

export default SchedulerInspector