// Imports
import { forwardRef, useContext, useImperativeHandle, useState } from 'react'

// Cloudscape component
import Alert        from "@cloudscape-design/components/alert"
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import FormField    from '@cloudscape-design/components/form-field'
import Header       from "@cloudscape-design/components/header"
import Link         from "@cloudscape-design/components/link"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Table        from "@cloudscape-design/components/table"

// Contexts:
import HelpPanelContext from '../contexts/HelpPanelContext'

// --------------------------
// Component main entry point
// --------------------------
const LabelsTable = forwardRef(function LabelsTable(props, ref) {
    const [ currentLabels, setCurrentLabels ] = useState(props.labels)
    const [ selectedLabels, setSelectedLabels ] = useState([])
    const { setHelpPanelOpen } = useContext(HelpPanelContext)

    const noLabelDefined = props.noLabelDefined
    const labels         = props.labels
    const redrawBrushes  = props.redrawBrushes
    const eChartRef      = props.eChartRef
    const labelsTableRef = props.labelsTableRef
    const readOnly       = props.readOnly

    // This function will allow the parent component (MultivariateTimeSeriesChart)
    // to trigger the update of the label table when the user brushes a new area
    // on the main chart:
    useImperativeHandle(ref, () => {
        return {
            updateTable(labels) {
                setCurrentLabels(labels)
            }
        };
    }, [])

    // Loops through all the item to build the table content:
    let items = []
    if (currentLabels && currentLabels.length > 0) {
        currentLabels.forEach((label, index) => {
            const duration = new Date(label.end) - new Date(label.start)
            const durationDays = parseInt(duration / 1000 / 86400)
            const daysUnit = durationDays > 1 ? 's' : ''
            const durationTime = new Date(duration).toISOString().substring(11, 19)

            // Creates the new label entry:
            items.push({
                name: `label_${index}`,
                startDate: new Date(label.start).toISOString().substring(0, 19).replace('T', ' '),
                endDate: new Date(label.end).toISOString().substring(0, 19).replace('T', ' '),
                start: label.start,
                end: label.end,
                duration: `${durationDays} day${daysUnit} ${durationTime}`,
                faultCode: "Fault code",
                notes: "Notes",
                equipment: "Equipment"
            })
        })
    }

    let noLabelText = ""
    if (noLabelDefined) {
        noLabelText = (<Box textAlign="center"><Alert type="error">No labels defined</Alert></Box>)
    }
    else {
        noLabelText = (<b>No labels defined</b>)
    }

    function deleteSelectedLabels(e) {
        e.preventDefault()
        let newLabels = []
        let labelsToDelete = []
        selectedLabels.forEach((label) => {
            labelsToDelete.push(parseInt(label.name.split('_')[1]))
        })

        labels.current.forEach((label, index) => {
            if (labelsToDelete.indexOf(index) == -1) {
                newLabels.push(label)
            }
        })

        labels.current = newLabels
        redrawBrushes(eChartRef, labels)
        labelsTableRef.current.updateTable(labels.current)
        setSelectedLabels([])
    }

    let selectionParameters = {}
    let actions = {}
    if (!readOnly) {
        selectionParameters = {
            selectionType: "multi",
            onSelectionChange: ({ detail }) => setSelectedLabels(detail.selectedItems),
            selectedItems: selectedLabels,
            trackBy: "name"
        }

        actions = {
            actions: 
                <Button
                    disabled={selectedLabels.length == 0}
                    onClick={(e) => deleteSelectedLabels(e)}
                >
                    Delete labels
                </Button>
        }
    }

    // Render the component:
    return (
        <Table
            {...selectionParameters}

            variant="embedded"
            contentDensity="compact"
            stripedRows={true}
            header={
                <Header
                    variant="h4"
                    description="This table lists all the labels selected above"
                    info={
                        <Link variant="info" onFollow={() => setHelpPanelOpen({
                            status: true,
                            page: 'labelling',
                            section: 'labelsTable'
                        })}>Info</Link>
                    }
                    {...actions}
                >
                    Labels list
                </Header>
            }
            columnDefinitions={[
                { id: "startDate", header: "Label start date", cell: e => <Box textAlign="right">{e.startDate}</Box> },
                { id: "endDate", header: "Label end date", cell: e => <Box textAlign="right">{e.endDate}</Box> },
                { id: "duration", header: "Label duration", cell: e => <Box textAlign="right">{e.duration}</Box> }
            ]}
            items={items}
            empty={
                <Box textAlign="center" color="inherit">
                    {noLabelText}
                    <Box
                        padding={{ bottom: "s" }}
                        variant="p"
                        color="inherit"
                    >
                        No labels to display in this table. Use the <b>Labeling</b> option in the left hand menu bar to define
                        historical events of interest (unplanned downtime, maintenance events...).
                    </Box>
                </Box>
            }
        />
    )
}, [])

export default LabelsTable