// Imports:
import { forwardRef, useContext, useState, useImperativeHandle } from 'react'
import { useNavigate } from 'react-router-dom'

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
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
    const { gateway, uid, navbarCounter, setNavbarCounter } = useContext(ApiGatewayContext)
    const [ visible, setVisible ] = useState(false)
    const [ errorMessage, setErrorMessage ] = useState(undefined)
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
        let currentErrorMessage = ""

        // Assemble the model creation request:
        let createRequest = {
            ModelName: modelConfig['modelName'],
            DatasetName: modelConfig['datasetName'],
            DatasetSchema: { InlineDataSchema: JSON.stringify(modelConfig['schema'])},
            TrainingDataStartTime: modelConfig['trainingStartDate'],
            TrainingDataEndTime: modelConfig['trainingEndDate'],
            EvaluationDataStartTime: modelConfig['evaluationStartDate'],
            EvaluationDataEndTime: modelConfig['evaluationEndDate'],
            DataPreProcessingConfiguration: { TargetSamplingRate: modelConfig['samplingRate'] },
            Tags: [
                {"Key": "Source", "Value": "L4EDemoApp"},
                {"Key": "AppVersion", "Value": window.version},
                {"Key": "User", "Value": uid}
            ]
        }

        // Launch the creation request:
        await gateway.lookoutEquipment.createModel(createRequest)
            .then((response) => { console.log(response) })
            .catch((error) => { 
                console.log(error.response)
                currentErrorMessage = JSON.stringify(error.response)
            })

        if (currentErrorMessage === "") {
            // This forces a refresh of the side bar navigation
            // so we can see the new model name popping up:
            setNavbarCounter(navbarCounter + 1)

            // We will also trigger a Step Function that will "listen"
            // to this model until training is finished:
            const sfnArn = window.modelResultsExtractionArn
            const inputPayload = { modelName: modelConfig['modelName'] }
            await gateway.stepFunctions
                         .startExecution(sfnArn, inputPayload)
                         .catch((error) => console.log(error.response))

            // Let's now redirect the user to the offline results page of this model
            const modelName = modelConfig['modelName'].slice(uid.length + 1 + modelConfig['projectName'].length + 1)
            const projectName = modelConfig['projectName']
            navigate(`/offline-results/modelName/${modelName}/projectName/${projectName}`)
        }
        else {
            setErrorMessage(currentErrorMessage)
        }
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
            <p>
                Click <b>Create model</b> below to confirm your model creation. You will be redirected to the
                model dashboard while training is in progress.
            </p>

            { errorMessage && <Alert type="error">
                Error detected while creating the model:
                <pre>{errorMessage}</pre>
            </Alert> }
        </Modal>
    )
})

export default CreateDefaultModel