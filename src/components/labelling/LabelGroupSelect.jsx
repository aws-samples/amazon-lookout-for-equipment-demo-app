// Imports
import { useContext } from 'react'

// Cloudscape components:
import Button       from "@cloudscape-design/components/button"
import FormField    from '@cloudscape-design/components/form-field'
import Link         from "@cloudscape-design/components/link"
import Select       from "@cloudscape-design/components/select"
import SpaceBetween from "@cloudscape-design/components/space-between"

// Contexts:
import HelpPanelContext       from '../contexts/HelpPanelContext'
import LabelingContext        from '../contexts/LabelingContext'

function LabelGroupSelect({ getLabels, formLabel, formDescription, showSecondaryControl, setLabelGroupName }) {
    const { setHelpPanelOpen } = useContext(HelpPanelContext)
    const { 
        deleteButtonDisabled,
        updateButtonDisabled,
        selectedOption,
        groupLabelOptions,
        setShowDeleteLabelGroupModal,
        setShowUpdateLabelGroupModal,
        setSelectedOption
    } = useContext(LabelingContext)

    let secondaryControl = (<></>)
    if (showSecondaryControl) {
        secondaryControl = (
            <SpaceBetween size="xs" direction="horizontal">
                <Button disabled={deleteButtonDisabled} 
                        onClick={() => { setShowDeleteLabelGroupModal(true) }}>
                    Delete group
                </Button>
                <Button disabled={updateButtonDisabled} 
                        onClick={() => { setShowUpdateLabelGroupModal(true) }}>
                    Update group
                </Button>
            </SpaceBetween>
        )
    }

    return (
        <FormField 
            label={formLabel}
            description={formDescription}
            info={
                <Link variant="info" onFollow={() => setHelpPanelOpen({
                    status: true,
                    page: 'labelling',
                    section: 'selectLabelGroup'
                })}>Info</Link>
            }
            secondaryControl={secondaryControl}
        >
            <Select
                selectedOption={selectedOption}
                onChange={({ detail }) => {
                    setSelectedOption(detail.selectedOption)
                    getLabels(detail.selectedOption, setLabelGroupName)
                }}
                options={groupLabelOptions}
                placeholder="Select an existing group to load the associated labels"
            />
        </FormField>
    )
}

export default LabelGroupSelect