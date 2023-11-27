// Imports
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import ConditionOverview    from './onlineMonitoring/ConditionOverview'
import SchedulerInspector   from './onlineMonitoring/SchedulerInspector'
import DetectedEvents       from './onlineMonitoring/DetectedEvents'
import SignalHistograms     from './onlineMonitoring/SignalHistograms'

// CloudScape Components:
import Alert             from "@cloudscape-design/components/alert"
import Badge             from "@cloudscape-design/components/badge"
import Box               from "@cloudscape-design/components/box"
import Container         from "@cloudscape-design/components/container"
import ContentLayout     from "@cloudscape-design/components/content-layout"
import ExpandableSection from "@cloudscape-design/components/expandable-section"
import Header            from "@cloudscape-design/components/header"
import Link              from "@cloudscape-design/components/link"
import SpaceBetween      from "@cloudscape-design/components/space-between"
import Tabs              from "@cloudscape-design/components/tabs"
import Tiles             from "@cloudscape-design/components/tiles"

// Context:
import ApiGatewayContext from './contexts/ApiGatewayContext'
import HelpPanelContext from './contexts/HelpPanelContext'
import { OnlineMonitoringProvider } from './contexts/OnlineMonitoringContext'

// Utils:
import { getSchedulerStatus } from "../utils/utils"
import { getLiveResults } from './onlineMonitoring/schedulerUtils'

// --------------------------
// Component main entry point
// --------------------------
function OnlineMonitoring() {
    const { modelName, projectName, initialRange } = useParams()

    const { gateway, uid } = useContext(ApiGatewayContext)
    const { helpPanelOpen, setHelpPanelOpen, panelContent } = useContext(HelpPanelContext)

    const [ range, setRange] = useState(initialRange ? initialRange : "30")
    const [ schedulerStatus, setSchedulerStatus ] = useState(undefined)
    const [ statusColor, setStatusColor ] = useState('grey')
    const [ liveResults, setLiveResults ] = useState(undefined)
    const [ loading, setLoading ] = useState(true)

    useEffect(() => {
        setHelpPanelOpen({
            status: helpPanelOpen.status,
            page: 'onlineResults',
            section: 'general'
        })
    }, [])
    
    // Get the current status of the scheduler to be displayed:
    useEffect(() => {
        getSchedulerStatus(gateway, `${uid}-${projectName}-${modelName}`)
        .then((x) => { 
            setSchedulerStatus(x)
            switch (x) {
                case 'STOPPED': setStatusColor('red'); break;
                case 'RUNNING': setStatusColor('green'); break;
            }
        })
    }, [gateway, modelName])

    // Then extract the live results of the current model:
    const endTime = parseInt(Date.now() / 1000)
    const startTime = parseInt((endTime - range * 86400))
    useEffect(() => {
        getLiveResults(gateway, uid, projectName, modelName, startTime, endTime)
        .then((x) => { 
            setLiveResults(x)
            if (x) { setLoading(false) }
        })
    }, [gateway, modelName, projectName, range])

    // Defining the info links:
    const detectedEventsInfoLink = (
        <Link variant="info" onFollow={() => setHelpPanelOpen({
            status: true,
            page: 'onlineResults',
            section: 'detectedEvents'
        })}>Info</Link>
    )

    let tabsDefinition = [
        {
            label: "Condition overview",
            id: "conditionOverview",
            content: <Container header={<Header 
                variant="h2" 
                description="The following widget shows the time your asset or process spent in 
                            an anomalous state. Note that this only take into account the time 
                            when the inference scheduler is running."
            >
                Condition overview
            </Header>}>
                <ConditionOverview range={range} modelName={modelName} projectName={projectName} height={300} />
            </Container>
        }
    ]

    if (liveResults) {
        tabsDefinition = [
            {
                label: "Condition overview",
                id: "conditionOverview",
                content: <Container header={<Header 
                    variant="h2" 
                    description="The following widget shows the time your asset or process spent in 
                                an anomalous state. Note that this only take into account the time 
                                when the inference scheduler is running."
                >
                    Condition overview
                </Header>}>
                    <ConditionOverview range={range} modelName={modelName} projectName={projectName} height={300} />
                </Container>
            },
            {
                label: "Detected events",
                id: "detectedEvents",
                content:
                    <Container header={
                        <Header
                            variant="h2"
                            info={detectedEventsInfoLink}>
                                Detected events
                        </Header>
                    }>
                        <DetectedEvents infoLink={detectedEventsInfoLink} />
                    </Container>
            },
            {
                label: "Signal deep dive",
                id: "signalDeepDive",
                content: <SignalHistograms />
            }
        ]
    }

    // Renders the component:
    return (
        <ContentLayout header={
            <Header>
                <SpaceBetween size="xl" direction="horizontal">
                    <Box variant="h1">{modelName} online monitoring</Box>
                    {schedulerStatus && <Box><Badge color={statusColor}>{schedulerStatus}</Badge></Box>}
                </SpaceBetween>
            </Header>
        }>
            <SpaceBetween size="xl">
                <Container 
                    header={<Header variant="h2">Scheduler configuration</Header>}
                    footer={
                        <>
                            <ExpandableSection headerText="Show details" variant="footer" defaultExpanded={!loading && !tabsDefinition}>
                                { !loading && !tabsDefinition && <><Alert>
                                    Your scheduler has not been running long enough. Come back to this screen in at least a scheduler cycle: for
                                    instance, if your model was trained with a sampling rate of 30 minutes, your scheduler will also wake up 
                                    every 30 minutes to process new data. In this case, check back this screen in 30 minutes to see the first 
                                    results generated by this scheduler.
                                </Alert><br /></> }
                                <SchedulerInspector />
                            </ExpandableSection>

                            {/* <ExpandableSection headerText="Latest results" variant="footer">
                                <div>Last run results...</div>
                            </ExpandableSection> */}
                        </>
                    }
                >
                    With Amazon Lookout for Equipment, you deploy a model by configuring an inference scheduler. The latter
                    wakes up on a regular basis, check for new input data, run it by the trained model and store the
                    results back into an output location on Amazon S3.
                </Container>

                <Container header={
                    <Header 
                        variant="h2" 
                        description="Change the period below to update the widgets accordingly"
                    >
                        Visualization range
                    </Header>
                }>
                    <Tiles
                        onChange={({ detail }) => setRange(detail.value)}
                        value={range}
                        items={[
                            { value: "1", label: "Last 24 hours" },
                            { value: "7", label: "Last 7 days" },
                            { value: "30", label: "Last 30 days" }
                        ]}
                    />
                </Container>

                { tabsDefinition && <>
                    <OnlineMonitoringProvider range={range}>
                        <Tabs
                            tabs={tabsDefinition}
                        />
                    </OnlineMonitoringProvider>
                </> }
            </SpaceBetween>
        </ContentLayout>
    )
}

export default OnlineMonitoring