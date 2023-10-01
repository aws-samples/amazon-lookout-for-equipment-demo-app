// CloudScape components:
import Box           from "@cloudscape-design/components/box"
import Button        from "@cloudscape-design/components/button"
import FormField     from "@cloudscape-design/components/form-field"
import Modal         from "@cloudscape-design/components/modal"
import SpaceBetween  from "@cloudscape-design/components/space-between"
import Textarea      from "@cloudscape-design/components/textarea"
import TextContent   from "@cloudscape-design/components/text-content"

// --------------------------------------------
// Components used to configure the application
// --------------------------------------------
function ReleaseInfo({ visible, onDiscard, publicationDate, releaseInfo, latestVersion }) {
    // Renders the modal window for the settings components:
    return (
        <Modal 
            visible={visible} 
            onDismiss={onDiscard} 
            header="New version available!"
            footer={
                <Box float="right">
                    <Button variant="primary" onClick={onDiscard}>
                        Close
                    </Button>
                </Box>
            }
        >
            <SpaceBetween size="l">
                <TextContent>
                    <p>
                        A new version of the Lookout for Equipment demo app has been released 
                        on <b>{publicationDate.slice(0,10)}</b>. Your current version 
                        is <b>v{window.version}</b> while the latest version is <b>v{latestVersion}</b>.
                    </p>
                </TextContent>

                <FormField label="Release notes:">
                    <Textarea 
                        value={releaseInfo}
                        readOnly={true}
                        rows="5"
                    />
                </FormField>

                <TextContent>
                    <p>
                        Get in touch with your administrator to update your app 
                        and benefit from these latest enhancements!
                    </p>
                </TextContent>
            </SpaceBetween>
        </Modal>
    )
}

export default ReleaseInfo