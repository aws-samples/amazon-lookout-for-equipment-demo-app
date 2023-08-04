// Imports
import { Storage } from 'aws-amplify'
import { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

// CloudScape components:
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import FormField    from "@cloudscape-design/components/form-field"
import Modal        from "@cloudscape-design/components/modal"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Spinner      from "@cloudscape-design/components/spinner"
import Textarea     from "@cloudscape-design/components/textarea"

// Contexts
import ApiGatewayContext from "../contexts/ApiGatewayContext"

// Utils:
import { getProjectData } from './projectDashboardUtils'

function DeleteProjectModal({ visible, onDiscard, onDelete, currentProjectName }) {
    const [ listModels, setListModels ] = useState([])
    const [ listSchedulers, setListSchedulers ] = useState([])
    const [ deleteInProgress, setDeleteInProgress ] = useState(false)
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { projectName } = useParams()
    const navigate = useNavigate()

    // Loads project configuration:
    useEffect(() => {
        getProjectData(gateway, uid + '-' + projectName)
        .then(({listModels, listSchedulers}) => { 
            setListModels(listModels)
            setListSchedulers(listSchedulers) 
        })
    }, [gateway, projectName])

    // -----------------------------------------------
    // Delete a given project and all its dependencies
    // (models, schedulers, tables...)
    // -----------------------------------------------
    const onDeleteProject = async (gateway, uid, projectName) => {
        setDeleteInProgress(true)

        // Delete the schedulers first: a model with an attached
        // scheduler (even not running, cannot be deleted):
        if (listSchedulers.length > 0) {
            for (const scheduler of listSchedulers) {
                setDeleteMessage('Deleting schedulers...')
                // If the scheduler is running, we need to stop it first:
                if (scheduler['status'] === 'RUNNING') {
                    await stopAndDeleteScheduler(gateway, scheduler['model'])
                }

                // Otherwise, we just delete it:
                else {
                    await deleteScheduler(gateway, scheduler['model'])
                }
            }
        }

        // Delete all the models:
        if (listModels.length > 0) {
            for (const model of listModels) {
                setDeleteMessage(`Deleting model: ${model}...`)

                await gateway.lookoutEquipment.deleteModel(model)
                if (listModels.length > 1) {
                    await new Promise(r => setTimeout(r, 1000))
                }
            }
        }

        // Delete all the labels groups linked to this project:
        // TO DO

        // Delete the DynamoDB Tables:
        setDeleteMessage(`Deleting DynamoDB tables...`)
        const listTables = await gateway.dynamoDbListTables()
    
        await deleteTable(gateway, listTables, `l4edemoapp-${uid}-${projectName}`)
        await deleteTable(gateway, listTables, `l4edemoapp-${uid}-${projectName}-sensor_contribution`)
        await deleteTable(gateway, listTables, `l4edemoapp-${uid}-${projectName}-anomalies`)
        await deleteTable(gateway, listTables, `l4edemoapp-${uid}-${projectName}-daily_rate`)
        await deleteTable(gateway, listTables, `l4edemoapp-${uid}-${projectName}-raw-anomalies`)

        // Delete the L4E project:
        setDeleteMessage(`Deleting Lookout for Equipment project...`)
        await gateway.lookoutEquipment
              .deleteDataset(`l4e-demo-app-${uid}-${projectName}`)
              .catch((error) => { console.log(error.response) })

        // Delete the raw data from S3:
        setDeleteMessage(`Deleting S3 artifacts...`)
        await Storage.remove(`${projectName}/${projectName}/sensors.csv`, { level: 'private' });

        // ### TO DO Delete also the raw-datasets used for ingestion ###
        // s3://.../raw-datasets/{projectName}/{projectName}/${projectName}/sensors.csv

        // Wait for a couple seconds, close the modal window and 
        // navigate away as this project does not exist anymore:
        await new Promise(r => setTimeout(r, 2000))
        setDeleteInProgress(false)
        navigate('/')
    }

    async function deleteTable(gateway, listTables, tableName) {
        const tableExists = (listTables['TableNames'].indexOf(tableName) >= 0)
        if (tableExists) {
            await gateway.dynamoDb
                  .deleteTable(tableName)
                  .catch((error) => { console.log(error.response) })
        }
    }

    // -------------------------------------------
    // Stops an existing scheduler, wait for it to
    // be in 'STOPPED' status and then delete it.
    // -------------------------------------------
    async function stopAndDeleteScheduler(gateway, modelName) {
        let status = 'RUNNING'

        await gateway.lookoutEquipment
              .stopInferenceScheduler(modelName + '-scheduler')
              .catch((error) => console.log(error.response))

        do {
            const response = await gateway.lookoutEquipment
                .listInferenceSchedulers(modelName)
                .catch((error) => console.log(error.response))

            if (response['InferenceSchedulerSummaries'].length > 0) {
                status = response['InferenceSchedulerSummaries'][0]['Status']
            }
            else {
                status = 'DELETED'
            }

            // To prevent API call throttling:
            await new Promise(r => setTimeout(r, 1000))

        } while (status !== 'STOPPED')

        await deleteScheduler(gateway, modelName)
    }

    // -----------------------------------------------------------
    // Launch a scheduler delete request and wait for it to finish
    // -----------------------------------------------------------
    async function deleteScheduler(gateway, modelName) {
        let status = 'STOPPED'

        await gateway.lookoutEquipment
              .deleteInferenceScheduler(modelName + '-scheduler')
              .catch((error) => console.log(error.response))

        do {
            const response = await gateway.lookoutEquipment
                .listInferenceSchedulers(modelName)
                .catch((error) => console.log(error.response))

            if (response['InferenceSchedulerSummaries'].length > 0) {
                status = response['InferenceSchedulerSummaries'][0]['Status']
            }
            else {
                status = 'DELETED'
            }

            await new Promise(r => setTimeout(r, 1000))

        } while (status !== 'DELETED')
    }

    async function deleteProject() {

    }

    const [ deleteMessage, setDeleteMessage ] = useState(undefined)

    return (
        <Modal 
            visible={visible} 
            onDismiss={onDiscard} 
            header="Delete project"
            footer={
                <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={onDiscard}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={() => onDeleteProject(gateway, uid, projectName)} disabled={deleteInProgress}>
                            {deleteInProgress ? <Spinner /> : "Delete"}
                        </Button>
                    </SpaceBetween>
                </Box>
              }
        >
            <SpaceBetween size="xs">
                <Box variant="span">
                    Permanently delete project <b>{currentProjectName}</b>? You cannot 
                    undo this action. The following related assets will also be deleted:
                </Box>

                <FormField label="Models" description="Models trained within this project. Note that you have to wait for all models trainings 
                                                       to be finished before you can delete this project">

                    {listModels && <Textarea
                        onChange={({ detail }) => setValue(detail.value)}
                        value={listModels.length == 0 ? "No model created" : listModels.join('\n')}
                        disabled={true}
                        rows={listModels.length == 0 ? 1 : listModels.length > 5 ? 5 : listModels.length}
                    />}

                    {!listModels && <Spinner />}
                </FormField>

                <FormField label="Schedulers" description="Some models have been deployed and the following schedulers have been configured. 
                                                           They will be stopped and deleted before the corresponding models are deleted">
                    <Textarea
                        onChange={({ detail }) => setValue(detail.value)}
                        value={listSchedulers.length > 0 ? listSchedulers.map((scheduler) => (
                            `${scheduler.model} (${scheduler.status})`
                        )) : 'No scheduler configured within this project'}
                        disabled={true}
                        rows={listSchedulers.length == 0 ? 1 : listSchedulers.length > 5 ? 5 : listSchedulers.length}
                    />
                </FormField>

                <FormField label="Files" description="This application stores intermediate results in Amazon S3 and DynamoDB. They will 
                                                      also be removed">
                    S3 resources

                    DynamoDB resources
                </FormField>

                {deleteMessage && <Box textAlign="center">{deleteMessage}</Box>}
            </SpaceBetween>
        </Modal>
    )
}

export default DeleteProjectModal