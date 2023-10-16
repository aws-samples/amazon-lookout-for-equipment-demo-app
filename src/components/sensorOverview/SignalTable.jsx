// Imports
import { useState } from 'react'

// Cloudscape components:
import Button                from '@cloudscape-design/components/button'
import Box                   from '@cloudscape-design/components/box'
import CollectionPreferences from "@cloudscape-design/components/collection-preferences"
import Pagination            from '@cloudscape-design/components/pagination'
import Table                 from '@cloudscape-design/components/table'
import TextFilter            from '@cloudscape-design/components/text-filter'

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
    const [ preferences, setPreferences ] = useState({
        pageSize: 10,
        contentDensity: 'compact',
        stripedRows: true,
        contentDisplay: [
            { id: "SensorName", visible: true },
            { id: "Grade", visible: true },
            { id: "DataStartTime", visible: false },
            { id: "DataEndTime", visible: false },
            { id: "Categorical", visible: true },
            { id: "LargeGaps", visible: true },
            { id: "Monotonic", visible: true },
            { id: "MultipleModes", visible: true },
            { id: "DuplicateTimestamps", visible: false },
            { id: "InvalidDateEntries", visible: false },
            { id: "InvalidValues", visible: false },
            { id: "MissingValues", visible: false }
        ]
    })

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
            pagination: { pageSize: preferences.pageSize },
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

            columnDisplay={preferences.contentDisplay}
            contentDensity={preferences.contentDensity}
            stripedRows={preferences.stripedRows}
            preferences={
                <CollectionPreferences
                    title="Preferences"
                    confirmLabel="Confirm"
                    onConfirm={({ detail }) => setPreferences(detail)}
                    preferences={preferences}
                    cancelLabel="Cancel"
                    pageSizePreference={{
                        title: "Page size",
                        options: [
                            { value: 10, label: "10 sensors" },
                            { value: 20, label: "20 sensors" },
                            { value: 50, label: "50 sensors" }
                        ]
                    }}
                    stripedRowsPreference={{'label': 'Striped rows', 'description': 'Select to add alternating shaded rows'}}
                    contentDensityPreference={{'label': 'Compact mode', 'description': 'Select to display content in a denser, more compact mode'}}
                    contentDisplayPreference={{
                        options: [
                            { id: "SensorName", label: "Sensor", alwaysVisible: true },
                            { id: "Grade", label: "Grade" },
                            { id: "DataStartTime", label: "Start time" },
                            { id: "DataEndTime", label: "End time" },
                            { id: "Categorical", label: "Categorical?" },
                            { id: "LargeGaps", label: "Large gaps?" },
                            { id: "Monotonic", label: "Monotonic?" },
                            { id: "MultipleModes", label: "Multiple modes?" },
                            { id: "DuplicateTimestamps", label: "Duplicates" },
                            { id: "InvalidDateEntries", label: "Invalid timestamps" },
                            { id: "InvalidValues", label: "Invalid values" },
                            { id: "MissingValues", label: "Missing values" },
                        ]
                    }}
                />
            }
        />
    )    
}

export default SignalTable