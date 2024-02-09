// Imports:
import { forwardRef, useContext, useImperativeHandle, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getModelSamplingRate } from './deploymentUtils.jsx'

// Cloudscape components:
import Alert            from "@cloudscape-design/components/alert"
import Box              from "@cloudscape-design/components/box"
import Button           from "@cloudscape-design/components/button"
import Checkbox         from "@cloudscape-design/components/checkbox"
import Container        from "@cloudscape-design/components/container"
import FormField        from "@cloudscape-design/components/form-field"
import Input            from "@cloudscape-design/components/input"
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

    const [ modelName, setModelName ]                                   = useState(undefined)
    const [ modelSamplingRate, setModelSamplingRate ]                   = useState(undefined)
    const [ deployInProgress, setDeployInProgress ]                     = useState(false)
    const [ visible, setVisible ]                                       = useState(false)
    const [ replayDataChecked, setReplayDataChecked ]                   = useState(false);
    const [ replayStartDate, setReplayStartDate ]                       = useState(undefined)
    const [ replayDuration, setReplayDuration ]                         = useState({ label: "1 day", value: "1day" })
    const [ invalidReplayStartDate, setInvalidReplayStartDate ]         = useState(false)
    const [ startDateSelectionLoading, setStartDateSelectionLoading ]   = useState(false)
    const [ samplingRateOptions, setSamplingRateOptions ]               = useState({})
    const [ selectedSamplingRate, setSelectedSamplingRate ]             = useState(undefined)
    const [ dataLag, setDataLag ]                                       = useState(0)

    const { gateway, uid, navbarCounter, setNavbarCounter }             = useContext(ApiGatewayContext)
    const { stateMachinesList, setStateMachinesList }                   = useContext(ModelDeploymentContext)

    const onDeployDismiss = props.onDismiss
    const onConfirm = props.onConfirm

    const bucket = window.appS3Bucket
    const inputLocation = `s3://${bucket}/inference-data/${modelName}/input/`
    const outputLocation = `s3://${bucket}/inference-data/${modelName}/output/`

    // -------------------------------------
    // Expose the visibility toggle of this 
    // modal window to the parent component:
    // -------------------------------------
    useImperativeHandle(ref, () => {
        return {
            async showDeploymentModal(showDeploymentModal, targetModelName) {
                if (showDeploymentModal) {
                    setModelName(targetModelName)
                    const { sr, srOptions, selectedOption } = await getModelSamplingRate(gateway, targetModelName)
                    setModelSamplingRate(sr)
                    setSamplingRateOptions(srOptions)
                    setSelectedSamplingRate(selectedOption)
                }
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
            dataUploadFrequency: selectedSamplingRate.value,
            dataLag: dataLag,
            uid: uid
        }

        if (replayDataChecked && !replayStartDate) {
            setInvalidReplayStartDate(true)
        }
        else {
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
            setReplayDataChecked(false)
            setDeployInProgress(false)
        }
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
                header={`Deploy model ${modelName.slice(uid.length + 1 + projectName.length + 1)}`}
                footer={
                    <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                            <Button variant="link" onClick={onDeployDismiss}>
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={ () => onDeployConfirm() } 
                                disabled={deployInProgress || startDateSelectionLoading}
                            >
                                {!deployInProgress && !startDateSelectionLoading ? 'Deploy' : <Spinner />}
                            </Button>
                        </SpaceBetween>
                    </Box>
                }
            >
                <SpaceBetween size="l">
                    { invalidReplayStartDate && <Alert type="error">You must set a valid start date before deploying this model</Alert> }

                    <Container>
                        <SpaceBetween size="s">
                            <Checkbox
                                onChange={({ detail }) => {
                                    if (detail.checked) { setStartDateSelectionLoading(true) }
                                    setReplayDataChecked(detail.checked) 
                                }}
                                checked={replayDataChecked}
                            >
                                Generate replay data from historical data
                            </Checkbox>

                            <Alert>
                                Before deploying your model, you can generate synthetic inference data by replaying part of the 
                                data initially used to evaluate this model.
                            </Alert>

                            { replayDataChecked && <>

                                <FormField label="Replay duration" description="How much replay data do you want to generate?">
                                    <Select
                                        selectedOption={replayDuration}
                                        onChange={({ detail }) => setReplayDuration(detail.selectedOption) }
                                        options={[
                                            { label: "1 day", value: "1day" },
                                            { label: "1 week", value: "1week" },
                                            { label: "1 month", value: "1month" }
                                        ]}
                                        disabled={!replayDataChecked}
                                    />
                                </FormField>

                                <StartDateSelection 
                                    modelName={modelName} 
                                    replayDuration={replayDuration['value']}
                                    disabled={!replayDataChecked}
                                    setParentReplayStartDate={setReplayStartDate}
                                    setStartDateSelectionLoading={setStartDateSelectionLoading}
                                />

                            </>}
                        </SpaceBetween>
                    </Container>

                    <FormField 
                        label="Data upload frequency"
                        description={`This model was trained with the following sampling rate: ${modelSamplingRate} second(s). 
                                      Pick a data upload frequency greater or equal to this.`}
                    >
                        <Select
                            selectedOption={selectedSamplingRate}
                            onChange={({ detail }) => setSelectedSamplingRate(detail.selectedOption) }
                            options={samplingRateOptions}
                        />
                    </FormField>

                    <FormField 
                        label="Data availability lag"
                        description="If live data is unavailable, adjust the availability lag accordingly. The 
                                     value below is set in hours. For instance, 24 means the scheduler will find
                                     data 24 hours old in the target location. This value will be used in the 
                                     online monitoring result to offset the date/time displayed."
                    >
                        <SpaceBetween direction="horizontal">
                            <Input
                                value={dataLag}
                                onChange={({ detail }) => setDataLag(detail.value) }
                                type="number"
                            />
                        </SpaceBetween>
                    </FormField>

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