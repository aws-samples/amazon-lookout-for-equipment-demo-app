// Imports
import { forwardRef, useImperativeHandle, useState } from 'react'

// Cloudscape component
import Alert     from "@cloudscape-design/components/alert"
import Box       from "@cloudscape-design/components/box"
import FormField from "@cloudscape-design/components/form-field"
import Table     from "@cloudscape-design/components/table"

// --------------------------
// Component main entry point
// --------------------------
const LabelsTable = forwardRef(function LabelsTable(props, ref) {
    const [currentLabels, setCurrentLabels] = useState(props.labels)
    const x = props.x
    const noLabelDefined = props.noLabelDefined

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
        currentLabels.forEach((label) => {
            const duration = new Date(x[label['end'] - 1]) - new Date(x[label['start']])
            const durationDays = parseInt(duration / 1000 / 86400)
            const daysUnit = durationDays > 1 ? 's' : ''
            const durationTime = new Date(duration).toISOString().substring(11, 19)

            // Creates the new label entry:
            items.push({
                startDate: x[label['start']],
                endDate: x[label['end'] - 1],
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

    // Render the component:
    return (
        <FormField stretch={true}>
            <Table
                variant="embedded"
                contentDensity="compact"
                stripedRows={true}
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
        </FormField>
    )
}, [])

export default LabelsTable