// CloudScape components:
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Modal        from "@cloudscape-design/components/modal"
import SpaceBetween from "@cloudscape-design/components/space-between"

function DeleteSchedulerModal({ visible, onDiscard, onDelete, currentModelName }) {
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
                Permanently delete scheduler <b>{currentModelName}</b>? You cannot 
                undo this action. The past results won't be removed from Amazon S3.
            </Box>
        </Modal>
    )
}

export default DeleteSchedulerModal