// Imports:
import { useContext } from 'react'
import { useParams } from 'react-router-dom'

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
import Box          from "@cloudscape-design/components/box"
import Container    from "@cloudscape-design/components/container"
import Form         from "@cloudscape-design/components/form"
import FormField    from "@cloudscape-design/components/form-field"
import Input        from "@cloudscape-design/components/input"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Textarea     from "@cloudscape-design/components/textarea"
import TextContent  from "@cloudscape-design/components/text-content"

// Contexts
import ModelParametersContext from '../contexts/ModelParametersContext'

function ReviewModelConfiguration() {
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
        selectedLabelGroupName,
        listModels,
        selectedSamplingRate
    } = useContext(ModelParametersContext)

    const { projectName } = useParams()
    const modelExists = listModels.current.indexOf(datasetName.current + '-' + modelName.current) >= 0
    let error = false

    if (trainingRange.current) {
        const trainingStartDate = trainingRange.current.startDate.replace('T', ' ').substr(0, 19)
        const trainingEndDate = trainingRange.current.endDate.replace('T', ' ').substr(0, 19)
        const evaluationStartDate = evaluationRange.current.startDate.replace('T', ' ').substr(0, 19)
        const evaluationEndDate = evaluationRange.current.endDate.replace('T', ' ').substr(0, 19)
        datasetName.current = projectName

        let listSignals = []
        selectedItems.forEach((signal) => {
            listSignals.push(signal['name'])
        })
        listSignals = listSignals.join('\n')

        let listLabels = []
        labels.current.forEach((label) => {
            const start = new Date(label.start).toISOString().replace('T', ' ').substring(0,19)
            const end = new Date(label.end).toISOString().replace('T', ' ').substring(0,19)
            listLabels.push(`From ${start} to ${end}`)
        })
        listLabels = listLabels.join('\n')

        let trainingDuration = new Date(trainingRange.current.endDate) - new Date(trainingRange.current.startDate)
        trainingDuration -= totalLabelDuration.current
        trainingDuration = parseInt(trainingDuration / 1000 / 86400)

        if (trainingDuration < 14 || 
            selectedItems.length === 0 || 
            modelName.current === "" || 
            (!selectedLabelGroupName.current && listLabels !== "") || 
            modelExists
        ) {
            error = true
        }

        const offCondition = `${datasetName.current} \\ ${selectedSignal.value} ${selectedOption.value} ${offConditionValue}`

        return (
            <Container>
                <Form>
                    <SpaceBetween size="xl">
                        <FormField label="Asset">
                            <TextContent><p>{datasetName.current}</p></TextContent>
                        </FormField>

                        <FormField label="Model name">
                            <Input
                                readOnly={true}
                                invalid={(modelName.current === "") || (modelExists)}
                                value={modelName.current === "" ? "Give a name to your model" : modelName.current}
                            />
                            {modelExists && <Box color="text-status-error" float="right">Model name already in use</Box>}
                        </FormField>

                        <FormField label="Training range">
                            <TextContent><p>
                                From {trainingStartDate} to {trainingEndDate} ({numTrainingDays.current})
                            </p></TextContent>
                        </FormField>

                        <FormField label="Evaluation range">
                            <TextContent><p>
                                From {evaluationStartDate} to {evaluationEndDate} ({numEvaluationDays.current})
                            </p></TextContent>
                        </FormField>

                        <FormField label="Training duration (90 days minimum)">
                            <Input 
                                value={`${trainingDuration} day${trainingDuration > 1 ? 's' : ''}`}
                                invalid={trainingDuration >= 14 ? false : true}
                                readOnly={true}
                            />
                        </FormField>

                        <FormField label="Sampling rate:">
                            <TextContent><p>{selectedSamplingRate['label']}</p></TextContent>
                        </FormField>
                        
                        <FormField label="Off-time detection">
                            {selectedSignal.value ? offCondition : 'No off time condition configured'}
                        </FormField>
                        
                        <FormField label={`${selectedItems.length} signal${selectedItems.length > 1 ? 's' : ''} selected (1 signal minimum)`}>
                            <Textarea
                                onChange={({ detail }) => setValue(detail.value)}
                                value={listSignals === "" ? "No signal selected" : listSignals}
                                readOnly={true}
                                invalid={listSignals === ""}
                                rows={listSignals === "" ? 1 : 5}
                            />
                        </FormField>

                        <FormField label={`${labels.current.length} label${labels.current.length > 1 ? 's' : ''} created (optional)`}>
                            <SpaceBetween size="s">
                                {selectedLabelGroupName.current ? 
                                    <Alert>
                                        The following labels will be used to train this model. 
                                        They are stored in label group <b>{selectedLabelGroupName.current}</b>.
                                    </Alert> 
                                    : ''
                                }
                                <Textarea
                                    onChange={({ detail }) => setValue(detail.value)}
                                    value={listLabels === "" ? "No label created" : listLabels}
                                    readOnly={true}
                                    rows={listLabels === "" ? 1 : 5}
                                />
                            </SpaceBetween>
                        </FormField>
                    </SpaceBetween>
                </Form>
            </Container>
        )
    }
    else {
        return (
            <div>Here.</div>
        )
    }
}

export default ReviewModelConfiguration