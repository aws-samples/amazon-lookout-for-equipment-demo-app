import Box from "@cloudscape-design/components/box"
import Header from "@cloudscape-design/components/header"
import Table from "@cloudscape-design/components/table"

// -------------------------------------------
// Component to build the table with the data 
// snippet shown on the project dashboard page
// -------------------------------------------
function DatasetOverview({ modelDetails }) {
    if (modelDetails) {
        // Get the tags list and filter out the non-sensor related columns:
        const tagsList = [...modelDetails.attributeList]
        const tagsToRemove = ['asset', 'sampling_rate', 'timestamp', 'unix_timestamp']
        tagsToRemove.forEach((tag) => {
            const index = tagsList.indexOf(tag)
            const removed = tagsList.splice(index, 1)
        })
        
        // Get the columns list:
        let columns = [
            {id: 'timestamp', header: 'timestamp', cell: e => e.timestamp},
        ]
        tagsList.forEach((item) => {
            columns.push({
                id: item,
                cell: e => (<Box float="right">{e[item] !== '...' ? parseFloat(e[item]).toFixed(2) : '...'}</Box>),
                header: item
            })
        })

        // Reformat the actual content for the table starting with the header:
        let tableItems = []
        modelDetails.contentHead.Items.forEach((item) => {
            let current_item = {}

            current_item['timestamp'] = <b>{item['timestamp'].S}</b>
            modelDetails.attributeList.forEach((column) => {
                current_item[column] = item[column].S
            })

            tableItems.push(current_item)
        })

        // Adding an ellipsis between header and tail:
        let current_item = {}
        modelDetails.attributeList.forEach((column) => {
            current_item[column] = '...'
        })
        tableItems.push(current_item)

        // Adding the dataset tail:
        modelDetails.contentTail.Items.forEach((item) => {
            let current_item = {}

            current_item['timestamp'] = <b>{item['timestamp'].S}</b>
            modelDetails.attributeList.forEach((column) => {
                current_item[column] = item[column].S
            })

            tableItems.push(current_item)
        })

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
                columnDefinitions={[        
                    {
                        id: "timestamp",
                        header: "timestamp",
                        cell: e => e.timestamp
                    }
                ]}
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
                contentDensity='compact'
                variant="embedded"
            />
        )
    }
}

export default DatasetOverview