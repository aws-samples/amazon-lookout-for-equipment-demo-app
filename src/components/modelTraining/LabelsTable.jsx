// Imports
import { forwardRef, useContext, useImperativeHandle, useState } from 'react'

// Cloudscape component
import Box from "@cloudscape-design/components/box"
import Button from "@cloudscape-design/components/button"
import FormField from "@cloudscape-design/components/form-field"
import Table from "@cloudscape-design/components/table"

// Contexts
import ModelParametersContext from '../contexts/ModelParametersContext'

// --------------------------
// Component main entry point
// --------------------------
const LabelsTable = forwardRef(function LabelsTable(props, ref) {
    const [currentLabels, setCurrentLabels] = useState(props.labels)
    const { trainingRange } = useContext(ModelParametersContext)
    const x = props.x

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
            const duration = new Date(x[label['end']]) - new Date(x[label['start']])
            const durationDays = parseInt(duration / 1000 / 86400)
            const daysUnit = durationDays > 1 ? 's' : ''
            const durationTime = new Date(duration).toISOString().substring(11, 19)

            // Creates the new label entry:
            items.push({
                startDate: x[label['start']],
                endDate: x[label['end']],
                duration: `${durationDays} day${daysUnit} ${durationTime}`,
                faultCode: "Fault code",
                notes: "Notes",
                equipment: "Equipment"
            })
        })
    }

    // Render the component:
    return (
        <FormField>
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
                        <b>No resources</b>
                        <Box
                            padding={{ bottom: "s" }}
                            variant="p"
                            color="inherit"
                        >
                            No resources to display.
                        </Box>
                    </Box>
                }
            />
        </FormField>
    )
}, [])

export default LabelsTable