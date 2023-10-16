// Cloudscape components:
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Modal        from "@cloudscape-design/components/modal"
import ProgressBar  from "@cloudscape-design/components/progress-bar"
import SpaceBetween from "@cloudscape-design/components/space-between"

function UpdateLabelGroupModal({ visible, onDiscard, onUpdate, selectedLabelGroup, labelUpdateProgress, updateProgressBarVisible }) {
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
            <SpaceBetween size="xl">
                <Box variant="span">
                    Are you sure you want to update this label group? You can't undo this action.
                </Box>

                { updateProgressBarVisible && <ProgressBar
                    value={labelUpdateProgress}
                    label="Updating labels"
                /> }
            </SpaceBetween>
        </Modal>
    )
}

export default UpdateLabelGroupModal