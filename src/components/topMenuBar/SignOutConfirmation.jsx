// CloudScape components:
import Box           from "@cloudscape-design/components/box"
import Button        from "@cloudscape-design/components/button"
import Modal         from "@cloudscape-design/components/modal"
import SpaceBetween  from "@cloudscape-design/components/space-between"

// --------------------------------------------
// Components used to configure the application
// --------------------------------------------
function SignOutConfirmation({ visible, onDiscard, signOut }) {
    // Renders the modal window for the settings components:
    return (
        <Modal 
            visible={visible} 
            onDismiss={onDiscard} 
            header="Sign out from the app?"
            footer={
                <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={onDiscard}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={() => signOut()}>
                            Sign out
                        </Button>
                    </SpaceBetween>
                </Box>
              }
        >
            <Box>
                Click on the <b>Sign out</b> button below to log off from this application. Otherwise,
                click anywhere to cancel.
            </Box>
        </Modal>
    )
}

export default SignOutConfirmation