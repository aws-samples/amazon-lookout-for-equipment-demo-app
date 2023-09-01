// Imports:
import { forwardRef, useContext, useState, useImperativeHandle } from 'react'
import { useNavigate } from 'react-router-dom'

// Cloudscape components:
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Modal        from "@cloudscape-design/components/modal"
import SpaceBetween from "@cloudscape-design/components/space-between"

// Contexts
import ApiGatewayContext from '../contexts/ApiGatewayContext'

// --------------------------
// Component main entry point
// --------------------------
const CreateDefaultModel = forwardRef(function CreateDefaultModel(props, ref) {
    const { gateway } = useContext(ApiGatewayContext)
    const [visible, setVisible] = useState(false)
    const dismissModelSummary = props.dismissFunction
    const modelConfig = props.modelConfig
    const navigate = useNavigate()

    useImperativeHandle(ref, () => {
        return {
            showModal(showModelSummary) {
                setVisible(showModelSummary)
            }
        }
    })

    async function createModel(e) {
        e.preventDefault()

        // Assemble the model creation request:
        let createRequest = {
            ModelName: modelConfig['modelName'],
            DatasetName: modelConfig['datasetName'],
            DatasetSchema: { InlineDataSchema: JSON.stringify(modelConfig['schema'])},
            TrainingDataStartTime: modelConfig['trainingStartDate'],
            TrainingDataEndTime: modelConfig['trainingEndDate'],
            EvaluationDataStartTime: modelConfig['evaluationStartDate'],
            EvaluationDataEndTime: modelConfig['evaluationEndDate'],
            DataPreProcessingConfiguration: { TargetSamplingRate: modelConfig['samplingRate'] }
        }

        // Launch the creation request:
        const response = await gateway.lookoutEquipmentCreateModel(createRequest)
            .then((response) => { console.log(response) })
            .catch((error) => { console.log(error.response)})

        navigate(`/offline-results/modelName/${modelConfig['modelName']}/projectName/${modelConfig['projectName']}`)
    }

    // Renders the modal window:
    return (
        <Modal
            onDismiss={() => { setVisible(false); dismissModelSummary() }}
            visible={visible}
            header="New model creation"
            footer={
                <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={() => { setVisible(false); dismissModelSummary() }}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={(e) => createModel(e)}>Create model</Button>
                    </SpaceBetween>
                </Box>
            }
        >
                Click <b>Create model</b> below to confirm your model creation. You will be redirected to the
                model dashboard while training is in progress.
        </Modal>
    )
})

export default CreateDefaultModel