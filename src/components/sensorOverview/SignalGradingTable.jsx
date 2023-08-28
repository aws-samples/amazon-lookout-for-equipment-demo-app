// Imports:
import { useEffect, useState, useContext } from 'react'

// App components:
import CategoricalFlag from '../shared/CategoricalFlag'

// Cloudscape components:
import Alert     from '@cloudscape-design/components/alert'
import Container from '@cloudscape-design/components/container'
import Header    from "@cloudscape-design/components/header"
import Link      from '@cloudscape-design/components/link'
import Spinner   from "@cloudscape-design/components/spinner"
import Table     from '@cloudscape-design/components/table'

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'
import HelpPanelContext from '../contexts/HelpPanelContext'

// Utils:
import { getSignalDetails } from '../../utils/dataExtraction'

// --------------------------
// Main component entry point
// --------------------------
function SignalGradingTable({ projectName, selectedItems, changeSelectedItems }) {
    const [ signalDetails, setSignalDetails ] = useState(undefined)
    const [ isLoading, setIsLoading ] = useState(true)
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { setHelpPanelOpen } = useContext(HelpPanelContext)

    useEffect(() => {
        getSignalDetails(gateway, uid + '-' + projectName)
        .then((x) => {
            setSignalDetails(x)
            setIsLoading(false)
        })
    }, [gateway])

    // console.log('signalDetails:', signalDetails)

    // The data query is done and the signal details are 
    // available from the Lookout for Equipment service:
    if (!isLoading && signalDetails) {
        if (signalDetails['sensorStatistics']) {
            // Defining columns for the table:
            const columns = [
                {id: "SensorName", header: "Sensor", cell: e => e.SensorName},
                {id: "DataStartTime", header: "Start time", cell: e => e.DataStartTime},
                {id: "DataEndTime", header: "End time", cell: e => e.DataEndTime},
                {id: "Categorical", header: "Categorical?", cell: e => (<CategoricalFlag type={e.Categorical} />)},
                {id: "LargeGaps", header: "Large gaps?", cell: e => (<CategoricalFlag type={e.LargeGaps} />)},
                {id: "Monotonic", header: "Monotonic?", cell: e => (<CategoricalFlag type={e.Monotonic} />)},
                {id: "MultipleModes", header: "Multiple modes?", cell: e => (<CategoricalFlag type={e.MultipleModes} />)},
                {id: "DuplicateTimestamps", header: "Duplicate timestamps", cell: e => e.DuplicateTimestamps},
                {id: "InvalidDateEntries", header: "Invalid timestamps", cell: e => e.InvalidDateEntries},
                {id: "InvalidValues", header: "Invalid values", cell: e => e.InvalidValues},
                {id: "MissingValues", header: "Missing values", cell: e => e.MissingValues},
            ]

            // Populating the content for the table:
            let tableItems = []
            signalDetails['sensorStatistics'].forEach((stat) => {
                const current_item = {
                    SensorName: stat['SensorName'],
                    'DataStartTime': new Date(stat['DataStartTime']*1000).toISOString().replace('T', ' ').substring(0,19),
                    'DataEndTime': new Date(stat['DataEndTime']*1000).toISOString().replace('T', ' ').substring(0,19),
                    'Categorical': stat['CategoricalValues']['Status'],
                    'LargeGaps': stat['LargeTimestampGaps']['Status'],
                    'Monotonic': stat['MonotonicValues']['Status'],
                    'MultipleModes': stat['MultipleOperatingModes']['Status'],
                    'DuplicateTimestamps': stat['DuplicateTimestamps']['Count'],
                    'InvalidDateEntries': stat['InvalidDateEntries']['Count'],
                    'InvalidValues': stat['InvalidValues']['Count'],
                    'MissingValues': stat['MissingValues']['Count'],
                }
                
                tableItems.push(current_item)
            })

            return (
                <Container header={<Header 
                                        variant="h1"
                                        info={ <Link variant="info" onFollow={() => setHelpPanelOpen({
                                            status: true,
                                            page: 'sensorOverview',
                                            section: 'signalGradingTable'
                                        })}>Info</Link> }
                                   >Signal grading</Header>}>
                    <Table
                        columnDefinitions={columns}
                        items={tableItems}
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
                </Container>
            )
        }
        else {
            return (
                <Container header={<Header variant="h1">Signal grading</Header>}>
                    Your dataset is currently being ingested into Lookout for Equipment. Depending on 
                    the size of your dataset this process may take between ten minutes and one hour. 
                    Once the ingestion is finished, you will be able to explore your time series signals
                    on this screen.
                </Container>
            )
        }
    }

    // Data is not loading anymore but nothing was collected: this means that the dataset 
    // was not ingested into the Lookout for Equipment service yet. Hence, the signal grading 
    // table is not available yet:
    else if (!isLoading && !signalDetails) {
        return (
            <Container header={<Header variant="h1">Signal grading</Header>}>
                <Alert header="Data preparation in progress">
                    Your Lookout for Equipment dataset is not created yet. After ingestion of your data
                    in the service, a grading of your signals will be performed. This screen will allow
                    you to explore your sensor data in depth.
                </Alert>
            </Container>
        )
    }

    // Otherwise, the data query is still running, so we display a spinner:
    else if (isLoading) {
        return (
            <Container header={<Header variant="h1">Signal grading</Header>}>
                <Spinner />
            </Container>        
        )
    }
}

export default SignalGradingTable