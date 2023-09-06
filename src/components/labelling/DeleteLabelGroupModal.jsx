// Imports
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// Cloudscape components:
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Modal        from "@cloudscape-design/components/modal"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Textarea     from "@cloudscape-design/components/textarea"

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'

// Utils:
import { listModelUsingLabelGroup } from './labelingUtils'

function DeleteLabelGroupModal({ visible, onDiscard, onDelete, selectedLabelGroup, internalLabelGroupName }) {
    const { projectName } = useParams()
    const { gateway, uid } = useContext(ApiGatewayContext)
    const [ attachedModels, setAttachedModels ] = useState([])
    const [ deleteDisabled, setDeleteDisabled ] = useState(true)

    useEffect(() => {
        listModelUsingLabelGroup(gateway, internalLabelGroupName, uid + '-' + projectName)
        .then((x) => {
            setAttachedModels(x)
            setDeleteDisabled(x.length > 0)
        })
    }, [gateway, internalLabelGroupName])

    return (
        <Modal 
            visible={visible} 
            onDismiss={onDiscard} 
            header={`Delete label group ${selectedLabelGroup}`}
            footer={
                <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={onDiscard}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={onDelete} disabled={deleteDisabled}>
                            Delete
                        </Button>
                    </SpaceBetween>
                </Box>
              }
        >

            { attachedModels.length > 0 && <Box variant="span">
                <SpaceBetween size="xs">
                    <Box>
                        This label group is used by <b>{attachedModels.length} model{attachedModels.length > 1 ? "s" : ""}</b> and
                        cannot be deleted.
                    </Box>

                    <Box>The following model{attachedModels.length > 1 ? "s" : ""} use{attachedModels.length > 1 ? "" : "s"} this label group:</Box>

                    <Textarea
                        value={attachedModels[0]}
                        readOnly={true}
                        rows={attachedModels.length > 5 ? 5 : attachedModels.length}
                    />
                </SpaceBetween>
                
            </Box> }

            { attachedModels.length == 0 && <Box variant="span">
                Permanently delete this label group? You can't undo this action.
            </Box> }
        </Modal>
    )
}

export default DeleteLabelGroupModal