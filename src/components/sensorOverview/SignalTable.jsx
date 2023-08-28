import Table from '@cloudscape-design/components/table'

// --------------------------
// Component main entry point
// --------------------------
function SignalTable({ cols, items, selectedItems, changeSelectedItems }) {
    return (
        <Table
            columnDefinitions={cols}
            items={items}
            loadingText="Loading resources"
            stripedRows={true}
            contentDensity='compact'
            sortingDisabled={false}
            variant="embedded"
            selectionType="single"
            onSelectionChange={({ detail }) => { changeSelectedItems(detail.selectedItems) }}
            selectedItems={selectedItems}
            trackBy="SensorName"
            stickyColumns={{ first: 1, last: 0 }}
        />
    )    
}

export default SignalTable