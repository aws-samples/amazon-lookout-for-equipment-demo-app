// Imports:
import { useContext } from 'react'
import { useParams } from 'react-router-dom'

// CloudScape components:
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Modal        from "@cloudscape-design/components/modal"
import SpaceBetween from "@cloudscape-design/components/space-between"

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'

function DeleteSchedulerModal({ visible, onDiscard, onDelete, currentModelName }) {
    const { uid } = useContext(ApiGatewayContext)
    const { projectName } = useParams()
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
            <Box variant="span">
                Permanently delete scheduler <b>{currentModelName.slice(uid.length + 1 + projectName.length + 1)}</b>? You cannot 
                undo this action. The past results won't be removed from Amazon S3.
            </Box>
        </Modal>
    )
}

export default DeleteSchedulerModal