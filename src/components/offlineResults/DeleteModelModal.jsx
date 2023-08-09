// Imports
import { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

// CloudScape components:
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import FormField    from "@cloudscape-design/components/form-field"
import Icon         from "@cloudscape-design/components/icon"
import Input        from "@cloudscape-design/components/input"
import Modal        from "@cloudscape-design/components/modal"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Spinner      from "@cloudscape-design/components/spinner"

// Contexts
import ApiGatewayContext from "../contexts/ApiGatewayContext"

// Utils
import { getSchedulerInfo } from "../../utils/dataExtraction"
import { stopAndDeleteScheduler, deleteScheduler } from '../../utils/utils'

// ==========================
// Component main entry point
// ==========================
function DeleteModelModal({ visible, onDiscard }) {
    const [ scheduler, setScheduler ] = useState(undefined)
    const [ deleteInProgress, setDeleteInProgress ] = useState(false)
    const [ deleteMessage, setDeleteMessage ] = useState(undefined)
    const { gateway } = useContext(ApiGatewayContext)
    const { modelName, projectName } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        getSchedulerInfo(gateway, modelName)
        .then((x) => setScheduler(x))
    }, [gateway, modelName])

    // --------------------------------------------------------------------
    // Delete a given model and the associated scheduler if it was deployed
    // --------------------------------------------------------------------
    const onDeleteModel = async (gateway, modelName) => {
        setDeleteInProgress(true)

        // Delete the scheduler first: a model with an attached
        // scheduler (even not running, cannot be deleted):
        if (scheduler) {
            // If the scheduler is running, we need to stop it first:
            if (scheduler['Status'] === 'RUNNING') {
                setDeleteMessage('Stopping and deleting scheduler...')
                await stopAndDeleteScheduler(gateway, modelName)
            }

            // Otherwise, we just delete it:
            else {
                setDeleteMessage('Deleting scheduler...')
                await deleteScheduler(gateway, modelName)
            }
        }

        // Delete the current model:
        setDeleteMessage('Deleting model...')
        await gateway.lookoutEquipment.deleteModel(modelName)

        // Navigate away from this page, which does not exist anymore:
        setDeleteInProgress(false)
        navigate(`/project-dashboard/projectName/${projectName}`)
    }

    // ---------------------
    // Renders the component
    // ---------------------
    return (
        <Modal 
            visible={visible} 
            onDismiss={onDiscard} 
            header="Delete model"
            footer={
                <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={onDiscard}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={() => onDeleteModel(gateway, modelName)} disabled={deleteInProgress}>
                            {deleteInProgress ? <Spinner /> : "Delete"}
                        </Button>
                    </SpaceBetween>
                </Box>
              }
        >
            <SpaceBetween size="xs">
                <Box variant="span">
                    Permanently delete model <b>{modelName}</b>? You cannot undo this action.
                </Box>

                {scheduler && 
                    <FormField label="Scheduler" description="This model has been deployed and the following scheduler has been configured. 
                                                              It will be stopped and deleted before the corresponding model is deleted">

                        <Input
                            value={scheduler['InferenceSchedulerName'] + ' (' + scheduler['Status'] + ')'} 
                            disabled={true}
                        />
                    </FormField>
                }

                {deleteMessage && <Box color="text-status-error"><Icon name="status-negative" variant="error" /> {deleteMessage}</Box>}
            </SpaceBetween>
        </Modal>
    )
}

export default DeleteModelModal