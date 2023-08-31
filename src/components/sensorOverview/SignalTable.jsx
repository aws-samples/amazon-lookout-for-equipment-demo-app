// Cloudscape components:
import Button       from '@cloudscape-design/components/button'
import Box          from '@cloudscape-design/components/box'
import Pagination   from '@cloudscape-design/components/pagination'
import Table        from '@cloudscape-design/components/table'
import TextFilter   from '@cloudscape-design/components/text-filter'

// Utils
import { useCollection } from '@cloudscape-design/collection-hooks'

// -------------------------------------------------------
// Component to show when the filter ends up with 0 result
// -------------------------------------------------------
function EmptyState({ title, subtitle, action }) {
    return (
        <Box textAlign="center" color="inherit">
            <Box variant="strong" textAlign="center" color="inherit">
                {title}
            </Box>

            <Box variant="p" padding={{ bottom: 's' }} color="inherit">
                {subtitle}
            </Box>

            {action}
        </Box>
    )
}

// -------------------------------------------------------
// Return number of matches found when filtering as a text
// -------------------------------------------------------
function getMatchesCountText(count) {
    return count === 1 ? '1 match' : `${count} matches`
}

// --------------------------
// Component main entry point
// --------------------------
function SignalTable({ cols, allItems, selectedItems, changeSelectedItems }) {
    // Add sorting, filtering and pagination to the table:
    const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
        allItems,
        {
            filtering: {
                noMatch: (
                    <EmptyState
                        title="No matches"
                        action={<Button onClick={() => actions.setFiltering('')}>Clear filter</Button>}
                    />
                ),
            },
            pagination: { pageSize: 18 },
            sorting: {},
        }
    )

    // Render the table:
    return (
        <Table
            {...collectionProps}
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
            stickyColumns={{ first: 0 }}
            pagination={<Pagination {...paginationProps} />}
            filter={
                <TextFilter
                  {...filterProps}
                  countText={getMatchesCountText(filteredItemsCount)}
                />
            }
        />
    )    
}

export default SignalTable