// Imports:
import { useContext, useEffect, useRef, useState } from 'react'

// CloudScape components:
import Alert             from "@cloudscape-design/components/alert"
import Box               from "@cloudscape-design/components/box"
import Button            from "@cloudscape-design/components/button"
import Container         from "@cloudscape-design/components/container"
import ExpandableSection from "@cloudscape-design/components/expandable-section"
import Header            from "@cloudscape-design/components/header"
import Link              from "@cloudscape-design/components/link"
import SpaceBetween      from "@cloudscape-design/components/space-between"
import Spinner           from '@cloudscape-design/components/spinner'
import Table             from '@cloudscape-design/components/table'
import TextContent       from '@cloudscape-design/components/text-content'

// App components:
import DeploymentModal from './DeploymentModal'
import DeleteSchedulerModal from './DeleteSchedulerModal'

// Contexts
import ApiGatewayContext from "../contexts/ApiGatewayContext"
import ModelDeploymentContext from "../contexts/ModelDeploymentContext"

// Utils:
import { buildModelTableContent, getSchedulerData } from './deploymentUtils'

// --------------------------
// Component main entry point
// --------------------------
function ListModels({ projectName }) {
    const { gateway, uid, navbarCounter, setNavbarCounter, showHelp } = useContext(ApiGatewayContext)
    const { stateMachinesList, setStateMachinesList } = useContext(ModelDeploymentContext)
    const [ isLoading, setIsLoading ] = useState(true)
    const [ sfnStatus, setSfnStatus ] = useState({})
    const [ modelsSummary, setModelsSummary ] = useState(undefined)
    const [ counter, setCounter ] = useState(0) 
    const [ showDeleteSchedulerModal, setShowDeleteSchedulerModal ] = useState(false)
    const [ currentModelName, setCurrentModelName ] = useState("")
    const [ showUserGuide, setShowUserGuide ] = useState(true)
    const modelDeploymentRef = useRef(null)

    // Loads model configuration:
    useEffect(() => {
        getSchedulerData(gateway, uid + '-' + projectName, stateMachinesList)
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
        await gateway.lookoutEquipment
            .stopInferenceScheduler(schedulerName)
            .catch((error) => console.log(error.response))
        
        setCounter(counter + 1)
    }

    const startScheduler = async (modelName) => {
        const schedulerName = modelName + '-scheduler'
        await gateway.lookoutEquipment
            .startInferenceScheduler(schedulerName)
            .catch((error) => console.log(error.response))

        setCounter(counter + 1)
    }

    const deleteScheduler = async (modelName) => {
        const schedulerName = currentModelName + '-scheduler'
        await gateway.lookoutEquipment
            .deleteInferenceScheduler(schedulerName)
            .catch((error) => console.log(error.response))
        
        // This forces a refresh of the side bar 
        // navigation and the list model table:
        setNavbarCounter(navbarCounter + 1)
        setCounter(counter + 1)
        setShowDeleteSchedulerModal(false)
    }

    const onDeleteInit = (modelName) => { 
        setCurrentModelName(modelName)
        setShowDeleteSchedulerModal(true) 
    }

    const onDeleteDiscard = () => {
        setShowDeleteSchedulerModal(false)
    }

    // ---------------------------------------------------
    // Model deployment modal window management functions:
    // ---------------------------------------------------
    const onDeployDismiss = () => {
        modelDeploymentRef.current.showDeploymentModal(false)
    }

    const showModelDeployment = (modelName) => { 
        modelDeploymentRef.current.showDeploymentModal(true, modelName)
    }

    // -----------------------------------------
    // Data is still loading, we show a spinner:
    // -----------------------------------------
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
            onDeleteInit
        )

        const onlineMonitoringLink = <Link 
        href={`/onlineMonitoring/modelName/${modelsSummary[0]['ModelName']}/ProjectName/${projectName}`}
        onFollow={(e) => { 
            e.preventDefault()
            navigate(`/onlineMonitoring/modelName/${modelsSummary[0]['ModelName']}/ProjectName/${projectName}`)
        }}>Online monitoring</Link>

        return (
            <Container header={<Header variant="h1">Model overview</Header>}>
                <DeleteSchedulerModal 
                    visible={showDeleteSchedulerModal} 
                    onDiscard={onDeleteDiscard} 
                    onDelete={deleteScheduler} 
                    currentModelName={currentModelName} />

                <SpaceBetween size="xl">
                    <Container>
                        <SpaceBetween size="xl">
                            { showHelp.current && showUserGuide && <Alert dismissible={true} onDismiss={() => setShowUserGuide(false)}>
                                After you've trained a model you can deploy it so that it can process live data and detect
                                anomalies in it. Use this screen to deploy model that you have previously trained within this
                                project.
                            </Alert> }

                            <ExpandableSection variant="footer" headerText="Click here to learn more about how to prepare your live data">
                                <TextContent>
                                    <p>
                                        When you deploy a model, you make it ready to receive inference data coming from live industrial systems such
                                        as the piece of equipment or process that you are operating. With this application, you have two ways to feed
                                        a deployed model with live data.
                                    </p>

                                    <h5>Method 1: Generate synthetic data</h5>
                                    <p>
                                        You can request this application to generate some synthetic data. This is suitable for a proof of concept
                                        for which you may not already have a pipeline to process and prepare your live data. When you choose this
                                        option, the application will use your historical data and extract up to one month of data. It will then
                                        prepare it and push it to the inference input location so the deployed model will be able to find it:
                                    </p>
                                    <p style={{textAlign: "center"}}>
                                        <img src="/scheduler-workflow-diagram-replay-data.png" width="700px" />
                                    </p>

                                    <h5>Method 2: Setup your live data pipeline</h5>
                                    <p>
                                        You can also leverage your own live data and setup a pipeline that will push your prepared data in the
                                        same location mentioned above. Your deployed model will search this input location, process your input
                                        data and deliver the results in the inference output location where it will be picked up by the online
                                        monitoring feature of this application:
                                    </p>
                                    <p style={{textAlign: "center"}}>
                                        <img src="/scheduler-workflow-diagram.png" width="1000px" />
                                    </p>


                                    <h5>How do I visualize the inference results?</h5>
                                    <p>
                                        In both cases, your model will generate inference results in Amazon S3, in the output location mentioned in the
                                        model deployment dialog box. You can then navigate to the <b>{onlineMonitoringLink}</b> to visualize the model
                                        live results.
                                    </p>
                                </TextContent>
                            </ExpandableSection>
                        </SpaceBetween>
                    </Container>
                    
                    <Box variant="p">
                        Here is the list of all models trained within project <b>{projectName}</b>:
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

export default ListModels