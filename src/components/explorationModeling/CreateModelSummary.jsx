// Imports:
import { forwardRef, useContext, useState, useImperativeHandle } from 'react'
import { useNavigate } from 'react-router-dom'

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import ColumnLayout from "@cloudscape-design/components/column-layout"
import Form         from "@cloudscape-design/components/form"
import FormField    from "@cloudscape-design/components/form-field"
import Input        from "@cloudscape-design/components/input"
import Modal        from "@cloudscape-design/components/modal"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Textarea     from "@cloudscape-design/components/textarea"
import TextContent  from "@cloudscape-design/components/text-content"

// Contexts
import ModelParametersContext from '../contexts/ModelParametersContext'
import TimeSeriesContext from '../contexts/TimeSeriesContext'
import ApiGatewayContext from '../contexts/ApiGatewayContext'

const CreateModelSummary = forwardRef(function CreateModelSummary(props, ref) {
    const { 
        trainingRange, 
        evaluationRange, 
        selectedItems, 
        labels, 
        numTrainingDays, 
        numEvaluationDays, 
        totalLabelDuration, 
        datasetName, 
        modelName,
        selectedOption,
        selectedSignal,
        offConditionValue,
        selectedLabelGroupName
    } = useContext(ModelParametersContext)

    const { x } = useContext(TimeSeriesContext)
    const { gateway } = useContext(ApiGatewayContext)
    const [visible, setVisible] = useState(false)
    const dismissModelSummary = props.dismissFunction
    const navigate = useNavigate()
    let error = false

    if (trainingRange.current) {
        const trainingStartDate = trainingRange.current.startDate.replace('T', ' ').substr(0, 19)
        const trainingEndDate = trainingRange.current.endDate.replace('T', ' ').substr(0, 19)
        const evaluationStartDate = evaluationRange.current.startDate.replace('T', ' ').substr(0, 19)
        const evaluationEndDate = evaluationRange.current.endDate.replace('T', ' ').substr(0, 19)
        datasetName.current = props.projectName

        let listSignals = []
        selectedItems.forEach((signal) => {
            listSignals.push(signal['name'])
        })
        listSignals = listSignals.join('\n')

        let listLabels = []
        labels.current.forEach((label) => {
            const start = x[label.start].replace('\n', ' ')
            const end = x[label.end].replace('\n', ' ')
            listLabels.push(`From ${start} to ${end}`)
        })
        listLabels = listLabels.join('\n')

        let trainingDuration = new Date(trainingRange.current.endDate) - new Date(trainingRange.current.startDate)
        trainingDuration -= totalLabelDuration.current
        trainingDuration = parseInt(trainingDuration / 1000 / 86400)

        if (trainingDuration < 90 || selectedItems.length === 0 || modelName.current === "" || (!selectedLabelGroupName.current && listLabels !== "")) {
            error = true
        }

        useImperativeHandle(ref, () => {
            return {
                showModal(showModelSummary) {
                    setVisible(showModelSummary)
                }
            }
        })

        async function createModel(e) {
            e.preventDefault()

            let schema = {
                Components: [
                    {
                        ComponentName: datasetName.current,
                        Columns: [
                            { Name: "timestamp", Type: "DATETIME" }
                        ]
                    }
                ]
            }

            selectedItems.forEach((signal) => {
                schema['Components'][0]['Columns'].push({
                    Name: signal['name'],
                    Type: "DOUBLE"
                })
            })

            let createRequest = {
                ModelName: datasetName.current + '-' + modelName.current,
                DatasetName: "l4e-demo-app-" + datasetName.current,
                DatasetSchema: { InlineDataSchema: JSON.stringify(schema) },
                TrainingDataStartTime: parseInt(new Date(trainingStartDate).getTime() / 1000),
                TrainingDataEndTime: parseInt(new Date(trainingEndDate).getTime() / 1000),
                EvaluationDataStartTime: parseInt(new Date(evaluationStartDate).getTime() / 1000),
                EvaluationDataEndTime: parseInt(new Date(evaluationEndDate).getTime()) / 1000,
                DataPreProcessingConfiguration: { TargetSamplingRate: 'PT5M' }
            }

            // Add off time detection option:
            if (selectedSignal.value) {
                createRequest['OffCondition'] = `${datasetName.current}\\${selectedSignal.value}${selectedOption.value}${offConditionValue}`
            }

            // Add labels option:
            if (selectedLabelGroupName.current) {
                createRequest['LabelsInputConfiguration'] = {
                    LabelGroupName: datasetName.current + '-' + selectedLabelGroupName.current
                }
            }

            console.log(createRequest)

            const response = await gateway.lookoutEquipmentCreateModel(createRequest)
                .then((response) => { console.log(response) })
                .catch((error) => { console.log(error.response)})

            navigate(`/offline-results/modelName/${datasetName.current + '-' + modelName.current}/projectName/${datasetName.current}`)
        }

        const offCondition = `${datasetName.current} \\ ${selectedSignal.value} ${selectedOption.value} ${offConditionValue}`

        return (
            <Modal
                onDismiss={() => { setVisible(false); dismissModelSummary() }}
                visible={visible}
                header="Model training parameters"
                footer={
                    <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                            <Button variant="link" onClick={() => { setVisible(false); dismissModelSummary() }}>
                                Cancel
                            </Button>
                            <Button variant="primary" disabled={error} onClick={(e) => createModel(e)}>Create model</Button>
                        </SpaceBetween>
                    </Box>
                }
            >
                <form onSubmit={(e) => {e.preventDefault()}}>
                    <Form>
                        <SpaceBetween size="xl">
                            <ColumnLayout columns={2}>
                                <FormField label="Asset:">
                                    <TextContent><p>{datasetName.current}</p></TextContent>
                                </FormField>

                                <FormField label="Model name:">
                                    <Input
                                        disabled={true}
                                        invalid={modelName.current === ""}
                                        value={modelName.current === "" ? "Give a name to your model" : modelName.current}
                                    />
                                </FormField>

                                <FormField label="Training range:">
                                    <TextContent><p>
                                        From {trainingStartDate}<br />
                                        to {trainingEndDate}<br />
                                        {numTrainingDays.current}
                                    </p></TextContent>
                                </FormField>

                                <FormField label="Evaluation range:">
                                    <TextContent><p>
                                        From {evaluationStartDate}<br />
                                        to {evaluationEndDate}<br />
                                        {numEvaluationDays.current}
                                    </p></TextContent>
                                </FormField>
                            </ColumnLayout>

                            <FormField label="Training duration (90 days minimum):">
                                <Input 
                                    value={`${trainingDuration} day${trainingDuration > 1 ? 's' : ''}`}
                                    invalid={trainingDuration >= 90 ? false : true}
                                    disabled={true}
                                />
                            </FormField>
                            
                            <FormField label="Off-time detection:">
                                {selectedSignal.value ? offCondition : 'No off time condition configured'}
                            </FormField>
                            <FormField label={`${selectedItems.length} signal${selectedItems.length > 1 ? 's' : ''} selected (1 signal minimum):`}>
                                <Textarea
                                    onChange={({ detail }) => setValue(detail.value)}
                                    value={listSignals === "" ? "No signal selected" : listSignals}
                                    disabled={true}
                                    invalid={listSignals === ""}
                                    rows={listSignals === "" ? 1 : 5}
                                />
                            </FormField>
                            <FormField label={`${labels.current.length} label${labels.current.length > 1 ? 's' : ''} created (optional):`}>
                                <SpaceBetween size="s">
                                    {selectedLabelGroupName.current ? <Alert>The following labels are stored in label group <b>{selectedLabelGroupName.current}</b>.</Alert> : ''}
                                    {(!selectedLabelGroupName.current && labels.current.length > 0) ? <Alert type="error">Your labels must be stored in a group. Navigate back to the <b>Labels</b> tab and create a new label group.</Alert> : ''}
                                    <Textarea
                                        onChange={({ detail }) => setValue(detail.value)}
                                        value={listLabels === "" ? "No label created" : listLabels}
                                        disabled={true}
                                        rows={listLabels === "" ? 1 : 5}
                                    />
                                </SpaceBetween>
                            </FormField>
                        </SpaceBetween>
                    </Form>
                </form>
            </Modal>
        )
    }   
})

export default CreateModelSummary