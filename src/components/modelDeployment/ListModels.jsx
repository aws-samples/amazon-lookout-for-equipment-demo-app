// Imports:
import { useContext, useEffect, useRef, useState } from 'react'

// CloudScape components:
import Alert        from "@cloudscape-design/components/alert"
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Container    from "@cloudscape-design/components/container"
import Header       from "@cloudscape-design/components/header"
import Modal        from "@cloudscape-design/components/modal"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Spinner      from '@cloudscape-design/components/spinner'
import Table        from '@cloudscape-design/components/table'

// App components:
import DeploymentModal from './DeploymentModal'

// Contexts
import ApiGatewayContext from "../contexts/ApiGatewayContext"
import ModelDeploymentContext from "../contexts/ModelDeploymentContext"

// Utils:
import { getModelsSummary, buildModelTableContent } from './deploymentUtils'

// --------------------------
// Component main entry point
// --------------------------
function ListModels({ projectName }) {
    const { gateway } = useContext(ApiGatewayContext)
    const { stateMachinesList, setStateMachinesList } = useContext(ModelDeploymentContext)
    const [ isLoading, setIsLoading ] = useState(true)
    const [ sfnStatus, setSfnStatus ] = useState({})
    const [ modelsSummary, setModelsSummary ] = useState(undefined)
    const [ counter, setCounter ] = useState(0)
    const [ showDeleteSchedulerModal, setShowDeleteSchedulerModal ] = useState(false)
    const [ currentModelName, setCurrentModelName ] = useState("")
    const modelDeploymentRef = useRef(null)

    // Loads model configuration:
    useEffect(() => {
        getSchedulerData(gateway, projectName, stateMachinesList)
        .then(({modelSummary, sfnStatus}) => {
            setModelsSummary(modelSummary)
            setIsLoading(false)
            setSfnStatus(sfnStatus)
        })
    }, [gateway, projectName, counter, stateMachinesList])

    // ------------------------------
    // Scheduler management functions
    // ------------------------------
    const stopScheduler = async (modelName) => {
        const schedulerName = modelName + '-scheduler'
        await gateway.lookoutEquipment.stopInferenceScheduler(schedulerName)
            .then((x) => response = x)
            .catch((error) => console.log(error.response))
        
        setCounter(counter + 1)
    }

    const startScheduler = async (modelName) => {
        const schedulerName = modelName + '-scheduler'
        await gateway.lookoutEquipment.startInferenceScheduler(schedulerName)
            .then((x) => response = x)
            .catch((error) => console.log(error.response))

        setCounter(counter + 1)
    }

    // -----------------------------
    // Scheduler deletion management
    // -----------------------------
    const deleteScheduler = async (modelName) => {
        const schedulerName = currentModelName + '-scheduler'
        await gateway.lookoutEquipment.deleteInferenceScheduler(schedulerName)
            .then((x) => response = x)
            .catch((error) => console.log(error.response))
        
        setCounter(counter + 1)
        setShowDeleteSchedulerModal(false)
    }

    function DeleteSchedulerModal({ visible, onDiscard, onDelete }) {
        return (
            <Modal 
                visible={visible} 
                onDismiss={onDiscard} 
                header="Delete scheduler"
                footer={
                    <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                            <Button variant="link" onClick={onDiscard}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={onDelete}>
                                Delete
                            </Button>
                        </SpaceBetween>
                    </Box>
                  }
            >
                <Box variant="span">Permanently delete scheduler <b>{currentModelName}</b>? You can't undo this action. The past results won't be removed from Amazon S3.</Box>
            </Modal>
        )
    }

    const onDeleteInit = (modelName) => { 
        setCurrentModelName(modelName)
        setShowDeleteSchedulerModal(true) 
    }

    const onDeleteDiscard = () => { setShowDeleteSchedulerModal(false) }

    // ---------------------------------------------------
    // Model deployment modal window management functions:
    // ---------------------------------------------------
    const onDeployDismiss = () => { modelDeploymentRef.current.showDeploymentModal(false) }

    const showModelDeployment = (modelName) => { 
        modelDeploymentRef.current.showDeploymentModal(true, modelName)
    }

    // ---------------------
    // Data is still loading
    // ---------------------
    if (isLoading) {
        return (
            <Container header={<Header variant="h1">Model overview</Header>}>
                <Spinner />
            </Container>
        )
    }

    // ---------------------------------------
    // Data was loaded but no model was found:
    // ---------------------------------------
    else if (!isLoading && !modelsSummary) {
        return (
            <Container header={<Header variant="h1">Model overview</Header>}>
                <Alert header={`No model was found for asset ${projectName}`}>
                    To train a model, you can navigate to the <b>Exploration & 
                    Modeling</b> section you will find in the left hand menu bar, 
                    configure your model and then click the <b>Create model</b>{' '}
                    button.
                </Alert>
            </Container>
        )
    }

    // --------------------------------------
    // Main section to render this component:
    // --------------------------------------
    else {
        const tableContent = buildModelTableContent(
            modelsSummary, 
            showModelDeployment, 
            stopScheduler, 
            startScheduler,
            onDeleteInit,
            sfnStatus
        )

        return (
            <Container header={<Header variant="h1">Model overview</Header>}>
                <DeleteSchedulerModal visible={showDeleteSchedulerModal} onDiscard={onDeleteDiscard} onDelete={deleteScheduler} />

                <SpaceBetween size="xl">
                    <Box variant="p">
                        Here is the list of all models trained for asset <b>{projectName}</b>:
                        Counter: {counter}
                    </Box>

                    <Table 
                        columnDefinitions={[
                            {id: "modelName", header: "Model", cell: e => e.name},
                            {id: "modelCreation", header: "Creation date", cell: e => e.creation},
                            {id: "modelStatus", header: "Status", cell: e => e.status},
                            {
                                id: "schedulerStatus", 
                                header: 
                                    <SpaceBetween size="xs" direction="horizontal">
                                        <Box><b>Scheduler status</b></Box>
                                        <Button iconName="refresh" variant="inline-icon" onClick={() => setCounter(counter + 1)} />
                                    </SpaceBetween>,
                                cell: e => e.schedulerStatus
                            },
                            {id: "scheduler", header: "Scheduler actions", cell: e => e.scheduler},
                        ]}
                        items={tableContent}
                    />
                </SpaceBetween>

                <DeploymentModal ref={modelDeploymentRef} onDismiss={onDeployDismiss} onConfirm={() => setCounter(counter + 1)} />
            </Container>
        )
    }
}

async function getSchedulerData(gateway, projectName, stateMachinesList) {
    const modelSummary = await getModelsSummary(gateway, projectName)
    const sfnStatus = await getStateMachineStatus(gateway, stateMachinesList)

    return {
        modelSummary: modelSummary,
        sfnStatus: sfnStatus
    }
}

async function getStateMachineStatus(gateway, arnList) {
    let schedulerLaunched = {}
    const modelList = Object.keys(arnList)

    if (modelList.length > 0) {
        for (const model of modelList) {
            schedulerLaunched[model] = false
            const arn = arnList[model]
            const response = await gateway.stepFunctions.getExecutionHistory(arn)
                .catch((error) => { console.log(error.response) })

            response['events'].forEach((activity) => {
                if (activity['type'] == 'TaskStateExited') {
                    schedulerLaunched[model] = true
                }
            })
        }
    }

    return schedulerLaunched
}

export default ListModels