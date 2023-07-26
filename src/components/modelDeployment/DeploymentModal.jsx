// Imports:
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react'
import { useParams } from 'react-router-dom'
// import { Storage } from 'aws-amplify'
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

    const { gateway } = useContext(ApiGatewayContext)
    const { stateMachinesList, setStateMachinesList } = useContext(ModelDeploymentContext)

    const onDeployDismiss = props.onDismiss
    const onConfirm = props.onConfirm

    const bucket = awsmobile['aws_user_files_s3_bucket']
    const inputLocation = `s3://${bucket}/inference-data/${projectName}/input/`
    const outputLocation = `s3://${bucket}/inference-data/${projectName}/output/`

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

    // ------------------------
    // Launch model deployment:
    // ------------------------
    const onDeployConfirm = async () => {
        const sfnArn = 'arn:aws:states:eu-west-1:905637044774:stateMachine:l4e-demo-app-deploy-model'
        const inputPayload = { 
            modelName: modelName, 
            projectName: projectName,
            generateReplayData: replayDataChecked,
            replayDuration: replayDuration['value'],
            replayStart: replayStartDate
        }

        let response = {}
        await gateway.stepFunctions.startExecution(sfnArn, inputPayload)
            .then((x) => response = x)
            .catch((error) => console.log(error.response))

        const executionArn = response['executionArn']

        let currentStateMachinesList = stateMachinesList
        currentStateMachinesList[modelName] = executionArn
        setStateMachinesList(currentStateMachinesList)

        setDeployInProgress(true)
        await new Promise(r => setTimeout(r, 2000));
        onConfirm()
        onDeployDismiss()
        setDeployInProgress(false)
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