// Cloudscape components:
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Modal        from "@cloudscape-design/components/modal"
import SpaceBetween from "@cloudscape-design/components/space-between"

function UpdateLabelGroupModal({ visible, onDiscard, onUpdate, selectedLabelGroup }) {
    return (
        <Modal 
            visible={visible} 
            onDismiss={onDiscard} 
            header={`Update label group ${selectedLabelGroup}`}
            footer={
                <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={onDiscard}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={onUpdate}>
                            Update
                        </Button>
                    </SpaceBetween>
                </Box>
              }
        >
            <Box variant="span">
                Are you sure you want to update this label group? You can't undo this action.
            </Box>
        </Modal>
    )
}

export default UpdateLabelGroupModal