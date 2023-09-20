// Imports:
import { forwardRef, useContext, useImperativeHandle, useState } from 'react'
import { useParams } from 'react-router-dom'
import awsmobile from '../../aws-exports'

// Cloudscape components:
import Alert            from "@cloudscape-design/components/alert"
import Box              from "@cloudscape-design/components/box"
import Button           from "@cloudscape-design/components/button"
import Checkbox         from "@cloudscape-design/components/checkbox"
import Container        from "@cloudscape-design/components/container"
import FormField        from "@cloudscape-design/components/form-field"
import Modal            from "@cloudscape-design/components/modal"
import Popover          from "@cloudscape-design/components/popover"
import Select           from "@cloudscape-design/components/select"
import SpaceBetween     from "@cloudscape-design/components/space-between"
import Spinner          from "@cloudscape-design/components/spinner"
import StatusIndicator  from "@cloudscape-design/components/status-indicator"

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'
import ModelDeploymentContext from "../contexts/ModelDeploymentContext"

// App components:
import StartDateSelection from './StartDateSelection'

// ---------------------
// Component entry point
// ---------------------
const DeploymentModal = forwardRef(function DeploymentModal(props, ref) {
    const { projectName } = useParams()

    const [ modelName, setModelName ] = useState(undefined)
    const [ deployInProgress, setDeployInProgress ] = useState(false)
    const [ visible, setVisible ] = useState(false)
    const [ replayDataChecked, setReplayDataChecked ] = useState(false);
    const [ replayStartDate, setReplayStartDate ] = useState(undefined)
    const [ replayDuration, setReplayDuration ] = useState({ label: "1 day", value: "1day" })

    const { gateway, uid, navbarCounter, setNavbarCounter } = useContext(ApiGatewayContext)
    const { stateMachinesList, setStateMachinesList } = useContext(ModelDeploymentContext)

    const onDeployDismiss = props.onDismiss
    const onConfirm = props.onConfirm

    const bucket = window.appS3Bucket
    const inputLocation = `s3://${bucket}/inference-data/${uid}-${modelName}/input/`
    const outputLocation = `s3://${bucket}/inference-data/${uid}-${modelName}/output/`

    // -------------------------------------
    // Expose the visibility toggle of this 
    // modal window to the parent component:
    // -------------------------------------
    useImperativeHandle(ref, () => {
        return {
            showDeploymentModal(showDeploymentModal, targetModelName) {
                setModelName(targetModelName)
                setVisible(showDeploymentModal)
            }
        }
    })

    // ------------------------------------------------------
    // Launch model deployment when the user clicks on Deploy
    // ------------------------------------------------------
    const onDeployConfirm = async () => {
        // Configure the state machine to be launched:
        const sfnArn = window.deployModelArn
        const inputPayload = { 
            modelName: modelName, 
            projectName: uid + '-' + projectName,
            generateReplayData: replayDataChecked,
            replayDuration: replayDuration['value'],
            replayStart: replayStartDate,
            uid: uid
        }

        // Start the state machine and gets its ARN:
        let response = {}
        await gateway.stepFunctions.startExecution(sfnArn, inputPayload)
            .then((x) => response = x)
            .catch((error) => console.log(error.response))
        const executionArn = response['executionArn']

        // Update the current state machine list in the model deployment context:
        let currentStateMachinesList = stateMachinesList
        currentStateMachinesList[modelName] = executionArn
        setStateMachinesList(currentStateMachinesList)

        // Wait for the scheduler to be running to close the modal 
        // window: replace the Deploy button by a Spinner while the 
        // scheduler is not running. Also triggers a refresh of the
        // initial models list component to update the scheduler status:
        setDeployInProgress(true)
        await checkSchedulerStatus(modelName)

        // This forces a refresh of the side bar navigation
        // so we can see the new project name popping up:
        setNavbarCounter(navbarCounter + 1)
        onConfirm()
        onDeployDismiss()
        setDeployInProgress(false)
    }

    // ----------------------------------------
    // Wait for a given scheduler to be running
    // ----------------------------------------
    async function checkSchedulerStatus(modelName) {
        let schedulerRunning = false

        do {
            const response = await gateway.lookoutEquipment
                .listInferenceSchedulers(modelName)
                .catch((error) => console.log(error.response))

            if (response['InferenceSchedulerSummaries'].length > 0) {
                schedulerRunning = response['InferenceSchedulerSummaries'][0]['Status'] === 'RUNNING'
            }

            await new Promise(r => setTimeout(r, 1000))

        } while (!schedulerRunning)
    }

    // ------------------------
    // Render the modal window:
    // ------------------------
    if (visible) {
        return (
            <Modal 
                visible={visible}
                onDismiss={onDeployDismiss}
                header={`Deploy model ${modelName}`}
                footer={
                    <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                            <Button variant="link" onClick={onDeployDismiss}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={ () => onDeployConfirm() } disabled={deployInProgress}>
                                {!deployInProgress ? 'Deploy' : <Spinner />}
                            </Button>
                        </SpaceBetween>
                    </Box>
                }
            >
                <SpaceBetween size="l">
                    <Container>
                        <SpaceBetween size="s">
                            <Checkbox
                                onChange={({ detail }) => setReplayDataChecked(detail.checked)}
                                checked={replayDataChecked}
                            >
                                Generate replay data from historical data
                            </Checkbox>

                            <Alert>
                                Before deploying your model, you can generate synthetic inference data by replaying part of the 
                                data initially used to evaluate this model.
                            </Alert>

                            <FormField label="Replay duration" description="How much replay data do you want to generate?">
                                <Select
                                    selectedOption={replayDuration}
                                    onChange={({ detail }) =>setReplayDuration(detail.selectedOption) }
                                    options={[
                                        { label: "1 day", value: "1day" },
                                        { label: "1 week", value: "1week" },
                                        { label: "1 month", value: "1month" }
                                    ]}
                                    disabled={!replayDataChecked}
                                />
                            </FormField>

                            <StartDateSelection 
                                projectName={projectName} 
                                modelName={modelName} 
                                gateway={gateway} 
                                replayDuration={replayDuration['value']}
                                disabled={!replayDataChecked}
                                setParentReplayStartDate={setReplayStartDate}
                                uid={uid}
                            />
                        </SpaceBetween>
                    </Container>

                    <FormField label="Live data input location" description="S3 location where your input files need to be sent">
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
                                onClick={() => { navigator.clipboard.writeText(inputLocation) }}
                            />
                        </Popover>
                        {inputLocation}
                    </FormField>

                    <FormField 
                        label="Live data results location" 
                        description="S3 location where your output files will be sent after the model process your inputs"
                    >
                        <Popover
                            size="medium"
                            position="top"
                            triggerType="custom"
                            dismissButton={false}
                            content={<StatusIndicator type="success">S3 output location copied</StatusIndicator>}
                        >
                            <Button
                                variant="inline-icon"
                                iconName="copy"
                                onClick={() => { navigator.clipboard.writeText(outputLocation) }}
                            />
                        </Popover>
                        {outputLocation}
                    </FormField>
                </SpaceBetween>
            </Modal>
        )
    }
})

export default DeploymentModal