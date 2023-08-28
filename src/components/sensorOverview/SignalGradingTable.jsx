// Imports:
import { useEffect, useState, useContext } from 'react'

// App components:
import SignalTable from './SignalTable'

// Cloudscape components:
import Alert     from '@cloudscape-design/components/alert'
import Container from '@cloudscape-design/components/container'
import Header    from "@cloudscape-design/components/header"
import Link      from '@cloudscape-design/components/link'
import Spinner   from "@cloudscape-design/components/spinner"

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'
import HelpPanelContext from '../contexts/HelpPanelContext'

// Utils:
import { buildTableItems } from './sensorOverviewUtils'

// --------------------------
// Main component entry point
// --------------------------
function SignalGradingTable({ projectName, selectedItems, changeSelectedItems }) {
    const [ signalDetails, setSignalDetails ] = useState(undefined)
    const [ isLoading, setIsLoading ] = useState(true)
    const [ items, setItems ] = useState(undefined)
    const [ cols, setCols ] = useState(undefined)
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { setHelpPanelOpen } = useContext(HelpPanelContext)

    useEffect(() => {
        buildTableItems(gateway, uid + '-' + projectName)
        .then(({signalDetails, tableColumns, tableItems}) => {
            setSignalDetails(signalDetails)
            setCols(tableColumns)
            setItems(tableItems)
            setIsLoading(false)
        })
    }, [gateway])

    // The data query is done and the signal details are 
    // available from the Lookout for Equipment service:
    if (!isLoading && signalDetails) {
        if (signalDetails['sensorStatistics']) {
            return (
                <Container header={<Header 
                                        variant="h1"
                                        info={ <Link variant="info" onFollow={() => setHelpPanelOpen({
                                            status: true,
                                            page: 'sensorOverview',
                                            section: 'signalGradingTable'
                                        })}>Info</Link> }
                                   >Signal grading</Header>}>

                    <SignalTable cols={cols} items={items} selectedItems={selectedItems} changeSelectedItems={changeSelectedItems} />
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