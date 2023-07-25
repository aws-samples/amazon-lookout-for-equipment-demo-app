// Imports:
import { useRef } from 'react'

// App component:
import DeploymentModal from '../modelDeployment/DeploymentModal'

// CloudScape components:
import Alert        from "@cloudscape-design/components/alert"
import Badge        from "@cloudscape-design/components/badge"
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import ColumnLayout from "@cloudscape-design/components/column-layout"
import Container    from "@cloudscape-design/components/container"
import Header       from "@cloudscape-design/components/header"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Spinner      from '@cloudscape-design/components/spinner'
import Table        from '@cloudscape-design/components/table'
import TextContent  from "@cloudscape-design/components/text-content"

// --------------------------
// Component main entry point
// --------------------------
function ModelOverview({ modelDetails, modelName }) {
    const modelDeploymentRef = useRef(null)

    // Define the badge color for the training status:
    let color = 'gray'
    if (modelDetails && modelDetails['status'] == 'SUCCESS') {
        color = 'green'
    }
    else {
        color = 'red'
    }

    // Renders the component:
    if (modelDetails) {
        let offCondition = ''
        if (modelDetails['offCondition']) {
            offCondition = modelDetails['offCondition']['component'] + '\\' +
                           modelDetails['offCondition']['signal'] + ' ' +
                           modelDetails['offCondition']['criteria'] + ' ' +
                           modelDetails['offCondition']['conditionValue']
        }
        else {
            offCondition = 'No off condition specified'
        }

        let items = undefined
        if (modelDetails['labels']) {
            items = []
            modelDetails['labels'].forEach((label) => {
                const duration = new Date(label['end']) - new Date(label['start'])
                const durationDays = parseInt(duration / 1000 / 86400)
                const daysUnit = durationDays > 1 ? 's' : ''
                const durationTime = new Date(duration).toISOString().substring(11, 19)
    
                // Creates the new label entry:
                items.push({
                    startDate: new Date(label['start'] * 1000).toISOString().substring(0, 19).replace('T', ' '),
                    endDate: new Date(label['end'] * 1000).toISOString().substring(0, 19).replace('T', ' '),
                    duration: (durationDays > 0) ? `${durationDays} day${daysUnit} ${durationTime}` : durationTime,
                })
            })
        }

        return (
            <Container header={<Header variant="h1">Model overview</Header>}>
                <SpaceBetween size="xl">
                    <ColumnLayout columns={3} variant="text-grid">
                        <SpaceBetween size="l">
                            <div>
                                <Box variant="awsui-key-label">Model status</Box>
                                <div>{<Badge color={color}>{modelDetails['status']}</Badge>}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Training time</Box>
                                <div>{modelDetails['trainingTime']}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Creation date</Box>
                                <div>{modelDetails['createdAt']}</div>
                            </div>
                        </SpaceBetween>

                        <SpaceBetween size="l">
                            <div>
                                <Box variant="awsui-key-label">Training data start date</Box>
                                <div>{modelDetails['trainingStart']}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Training data end date</Box>
                                <div>{modelDetails['trainingEnd']}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Sampling rate</Box>
                                <div>{modelDetails['samplingRate']}</div>
                            </div>
                        </SpaceBetween>

                        <SpaceBetween size="l">
                            <div>
                                <Box variant="awsui-key-label">Evaluation data start date</Box>
                                <div>{modelDetails['evaluationStart']}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Evaluation data end date</Box>
                                <div>{modelDetails['evaluationEnd']}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Off time detection</Box>
                                <div>{offCondition}</div>
                            </div>
                        </SpaceBetween>
                    </ColumnLayout>

                    {!modelDetails['labels'] ? '' : <SpaceBetween size="xxs">
                        <Box variant="awsui-key-label">Labels</Box>
                        <Alert>
                            Some labels were defined to train this model: this labeled data indicates periods 
                            when your equipment or process did not function propertly. When training a model
                            with labels, Lookout for Equipment will discard these time ranges to increase its
                            capability to model only the normal operating states of your equipment or process.
                            It will then use these sames ranges to rank the different models trained and identify
                            the best performing one.
                        </Alert>
                        <Table 
                            variant="embedded"
                            contentDensity="compact"
                            stripedRows={true}
                            columnDefinitions={[
                                { id: "startDate", header: "Label start", cell: e => <Box textAlign="right">{e.startDate}</Box> },
                                { id: "endDate", header: "Label end", cell: e => <Box textAlign="right">{e.endDate}</Box> },
                                { id: "duration", header: "Label duration", cell: e => <Box textAlign="right">{e.duration}</Box> }
                            ]}
                            items={items}
                        />
                    </SpaceBetween>}
                </SpaceBetween>
            </Container>
        )
    }

    // While loading the component, we display a spinner:
    else {
        return (
            <Container header={<Header variant="h1">Model overview</Header>}>
                <Spinner />
            </Container>
        )
    }
}

export default ModelOverview