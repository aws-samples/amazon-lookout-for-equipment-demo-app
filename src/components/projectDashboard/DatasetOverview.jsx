// Cloudscape components:
import Box from "@cloudscape-design/components/box"
import Table from "@cloudscape-design/components/table"

// Utils:
import { cleanList } from '../../utils/utils'
import { buildColumnsDefinition, buildTableItems } from './projectDashboardUtils'

// -------------------------------------------
// Component to build the table with the data 
// snippet shown on the project dashboard page
// -------------------------------------------
function DatasetOverview({ modelDetails }) {
    if (modelDetails) {
        // Get the tags list and filter out the non-sensor related columns:
        let tagsList = [...modelDetails.attributeList]
        const tagsToRemove = ['asset', 'sampling_rate', 'timestamp', 'unix_timestamp']
        tagsList = cleanList(tagsToRemove, tagsList)
        tagsList.sort()

        // Build the table components (header and body):
        const columns = buildColumnsDefinition(tagsList)
        const tableItems = buildTableItems(modelDetails)

        // Render the component:
        return (
            <Table
                columnDefinitions={columns}
                items={tableItems}
                loadingText="Loading resources"
                stripedRows={true}
                contentDensity='compact'
                sortingDisabled={true}
                variant="embedded"
                stickyColumns={{ first: 1, last: 0 }}
            />
        )
    }
    else {
        // Render an empty table:
        return (
            <Table
                columnDefinitions={[{ id: "timestamp", header: "timestamp", cell: e => e.timestamp }]}
                items={[]}
                loadingText="Loading resources"
                empty={
                    <Box textAlign="center" color="inherit">
                        <b>No sensor data</b>

                        <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                            No sensor data to display.
                        </Box>
                    </Box>
                }
                contentDensity="compact"
                variant="embedded"
            />
        )
    }
}

export default DatasetOverview