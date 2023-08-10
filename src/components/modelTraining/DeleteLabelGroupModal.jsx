import Modal from "@cloudscape-design/components/modal"

function DeleteLabelGroupModal({ visible, onDiscard }) {
    return (
        <Modal visible={visible} onDismiss={onDiscard} header="Delete label group" />
    )
}

export default DeleteLabelGroupModal