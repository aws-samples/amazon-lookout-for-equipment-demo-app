// Imports:
import { useContext, useState } from 'react'

// App components:
import DeleteModelModal from './DeleteModelModal'

// CloudScape components:
import Alert                from "@cloudscape-design/components/alert"
import Badge                from "@cloudscape-design/components/badge"
import Box                  from "@cloudscape-design/components/box"
import Button               from "@cloudscape-design/components/button"
import ColumnLayout         from "@cloudscape-design/components/column-layout"
import Container            from "@cloudscape-design/components/container"
import ExpandableSection    from "@cloudscape-design/components/expandable-section"
import Header               from "@cloudscape-design/components/header"
import Link                 from "@cloudscape-design/components/link"
import Popover              from "@cloudscape-design/components/popover"
import SpaceBetween         from "@cloudscape-design/components/space-between"
import Spinner              from '@cloudscape-design/components/spinner'
import StatusIndicator      from "@cloudscape-design/components/status-indicator"
import Table                from '@cloudscape-design/components/table'
import Textarea             from "@cloudscape-design/components/textarea"
import TextContent          from '@cloudscape-design/components/text-content'

// Contexts:
import HelpPanelContext from '../contexts/HelpPanelContext'
import ApiGatewayContext from '../contexts/ApiGatewayContext'
import OfflineResultsContext from '../contexts/OfflineResultsContext'

// --------------------------
// Component main entry point
// --------------------------
function ModelOverview() {
    const { modelDetails, setDeleteInProgress } = useContext(OfflineResultsContext)

    const [ showDeleteModelModal, setShowDeleteModelModal ] = useState(false)
    const [ showUserGuide, setShowUserGuide ] = useState(true)
    const { setHelpPanelOpen } = useContext(HelpPanelContext)
    const { showHelp } = useContext(ApiGatewayContext)

    // Define the badge color for the training status:
    let color = 'gray'
    if (modelDetails && modelDetails['status'] === 'SUCCESS') {
        color = 'green'
    }
    else {
        color = 'red'
    }

    // Renders the component:
    if (modelDetails) {
        let schema = []
        const numSignalsUsed = modelDetails.schema.Components[0].Columns.length
        modelDetails.schema.Components[0].Columns.forEach((signal) => {
            schema.push(signal['Name'])
        })
        const rawSchema = schema.slice(1).join('\n')
        schema = '- ' + schema.join('\n- ')
        

        let offCondition = 'No off condition specified'
        if (modelDetails['offCondition']) {
            offCondition = modelDetails['offCondition']['component'] + '\\' +
                           modelDetails['offCondition']['signal'] + ' ' +
                           modelDetails['offCondition']['criteria'] + ' ' +
                           modelDetails['offCondition']['conditionValue']
        }

        let items = undefined
        if (modelDetails['labels']) {
            items = []
            modelDetails['labels'].forEach((label) => {
                const duration = new Date(label['end']) - new Date(label['start'])
                const durationDays = parseInt(duration / 86400 / 1000)
                const daysUnit = durationDays > 1 ? 's' : ''
                const durationTime = new Date(duration).toISOString().substring(11, 19)
    
                // Creates the new label entry:
                items.push({
                    startDate: new Date(label['start']).toISOString().substring(0, 19).replace('T', ' '),
                    endDate: new Date(label['end']).toISOString().substring(0, 19).replace('T', ' '),
                    duration: (durationDays > 0) ? `${durationDays} day${daysUnit} ${durationTime}` : durationTime,
                })
            })
        }

        return (
            <SpaceBetween size="xl">
                <Container header={
                    <Header 
                        variant="h1"
                        info={
                            <Link variant="info" onFollow={() => setHelpPanelOpen({
                                status: true,
                                page: 'offlineResults',
                                section: 'modelOverview'
                            })}>Info</Link>
                        }
                        actions={
                            <Button 
                                iconName="status-negative" 
                                onClick={() => setShowDeleteModelModal(true)}
                                disabled={modelDetails['status'] === 'IN_PROGRESS'}
                            >
                                Delete model
                            </Button>
                        }>
                        Model overview
                    </Header>
                }>
                    <SpaceBetween size="xl">
                        { showHelp && showUserGuide && <Alert dismissible={true} onDismiss={() => setShowUserGuide(false)}>
                            Once a model is trained you can use the <b>Model overview</b> section to visualize the parameters 
                            used for training. At training time, you can optionnally specify an evaluation range that Lookout
                            for Equipment will use to help you assess if your model was able to capture any event of interest 
                            in your historical data. This evaluation is available in the <b>Detected events</b> section below.
                            From this screen you can also <b>Delete</b> a model that you don't need anymore.
                        </Alert> }
                        
                        <ColumnLayout columns={3} variant="text-grid">
                            <SpaceBetween size="l">
                                <div>
                                    <Box variant="awsui-key-label">Model status</Box>
                                    <div>{<Badge color={color}>{modelDetails['status']}</Badge>}</div>
                                </div>

                                { (modelDetails && modelDetails['status'] !== 'FAILED') && <div>
                                    <Box variant="awsui-key-label">Training time</Box>
                                    <div>
                                        {modelDetails && modelDetails['status'] === 'SUCCESS' && modelDetails['trainingTime']}
                                        {modelDetails && modelDetails['status'] !== 'SUCCESS' && 'n/a'}
                                    </div>
                                </div> }

                                { (modelDetails && modelDetails['status'] === 'FAILED') && <div>
                                    <Alert type="error">
                                        Model training failed with the following error:&nbsp;
                                        <i>{modelDetails['failedReason']}</i> You can delete 
                                        this model, verify your training parameters and create
                                        a new one.
                                    </Alert>
                                </div> }

                                <div>
                                    <Box variant="awsui-key-label">Creation date</Box>
                                    <div>{modelDetails['createdAt']}</div>
                                </div>

                                <div>
                                    <Box variant="awsui-key-label">Sampling rate</Box>
                                    <div>{modelDetails['samplingRate']}</div>
                                </div>
                            </SpaceBetween>

                            <SpaceBetween size="l">
                                <div>
                                    <Box variant="awsui-key-label">Training data</Box>
                                    <div>
                                        From <b>{modelDetails['trainingStart']}</b> to <b>{modelDetails['trainingEnd']}</b>
                                    </div>
                                </div>

                                <div>
                                    <Box variant="awsui-key-label">Evaluation data</Box>
                                    <div>
                                        From <b>{modelDetails['evaluationStart']}</b> to <b>{modelDetails['evaluationEnd']}</b>
                                    </div>
                                </div>

                                <div>
                                    <Box variant="awsui-key-label">Off time detection</Box>
                                    <div>{offCondition}</div>
                                </div>
                            </SpaceBetween>

                            <SpaceBetween size="xs">
                                <Box variant="awsui-key-label">
                                    {numSignalsUsed} signals used to train this model
                                </Box>
                                <Textarea
                                    value={schema}
                                    readOnly={true}
                                    rows="6"
                                />
                                <Popover
                                        size="medium"
                                        position="top"
                                        triggerType="custom"
                                        dismissButton={false}
                                        content={<StatusIndicator type="success">Signals list copied</StatusIndicator>}
                                    >
                                    <Button
                                        variant="inline-link"
                                        iconAlign="left"
                                        iconName="copy"
                                        onClick={() => { navigator.clipboard.writeText(rawSchema) }}
                                    >
                                        Copy this signals list to the clipboard
                                    </Button>
                                </Popover>
                                <Box color="text-body-secondary" variant="small">
                                    When training a new model with this dataset, you can then copy-paste this selection to
                                    train a model with the same signals.
                                </Box>
                            </SpaceBetween>
                        </ColumnLayout>

                        {/* Only shows this section if some labels were defined for this model  */}
                        {!modelDetails['labels'] ? '' : <ExpandableSection headerText="Defined labels"><SpaceBetween size="xxs">
                            {showHelp && <Alert>
                                Some labels were defined to train this model: this labeled data indicates periods 
                                when your equipment or process did not function propertly. When training a model
                                with labels, Lookout for Equipment will discard these time ranges to increase its
                                capability to model only the normal operating states of your equipment or process.
                                It will then use these sames ranges to rank the different models trained and identify
                                the best performing one.
                            </Alert> }

                            <TextContent><p>
                                The following labels were defined in the <b>{modelDetails['labelGroupName']}</b> label group:
                            </p></TextContent>

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
                        </SpaceBetween></ExpandableSection>}
                    </SpaceBetween>

                    <DeleteModelModal
                        visible={showDeleteModelModal}
                        onDiscard={() => { setShowDeleteModelModal(false) }}
                        setDeleteInProgress={setDeleteInProgress}
                    />
                </Container>
            </SpaceBetween>
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