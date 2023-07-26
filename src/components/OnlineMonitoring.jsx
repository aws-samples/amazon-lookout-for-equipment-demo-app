// Imports
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// App components:
import NavigationBar        from './NavigationBar'
import ConditionOverview    from './onlineMonitoring/ConditionOverview'
import AnomalyScore         from './onlineMonitoring/AnomalyScore'
import SensorContribution   from './onlineMonitoring/SensorContribution'

// CloudScape Components:
import AppLayout        from "@cloudscape-design/components/app-layout"
import Container        from "@cloudscape-design/components/container"
import ContentLayout    from "@cloudscape-design/components/content-layout"
import Grid             from "@cloudscape-design/components/grid"
import Header           from "@cloudscape-design/components/header"
import SpaceBetween     from "@cloudscape-design/components/space-between"
import Tiles            from "@cloudscape-design/components/tiles"

function OnlineMonitoring() {
    const { modelName, projectName, initialRange } = useParams()
    const [ range, setRange] = useState(initialRange ? initialRange : "7")

    return (
        <AppLayout
            contentType="default"
            content={
                <ContentLayout header={<Header variant="h1">{modelName} online monitoring</Header>}>
                    <SpaceBetween size="xl">
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
                                    { value: "1", label: "Today" },
                                    { value: "7", label: "Last 7 days" },
                                    { value: "30", label: "Last 30 days" }
                                ]}
                            />
                        </Container>

                        <Grid gridDefinition={[
                            { colspan: {l: 4, m: 6, default: 12} },
                            { colspan: {l: 4, m: 6, default: 12} },
                            { colspan: {l: 4, m: 12, default: 12} }
                        ]}>
                            <Container header={<Header 
                                variant="h1" 
                                description="The following widget shows the time your asset or process spent in 
                                             an anomalous state. Note that this only take into account the time 
                                             when the inference scheduler is running."
                            >
                                Condition overview
                            </Header>}>
                                <ConditionOverview range={range} modelName={modelName} projectName={projectName} size="large" />
                            </Container>

                            <Container header={<Header 
                                variant="h1"
                                description="This widget plots the raw anomaly score emitted by your model. Amazon
                                             Lookout for Equipment considers that an anomalous event occurred when
                                             this score goes above a threshold of 0.5"
                            >
                                Anomaly score
                            </Header>}>
                                <AnomalyScore range={range} />
                            </Container>

                            <Container header={<Header 
                                variant="h1"
                                description="This widget plots the sensor contribution whenever the anomaly score is greater than 0.5"
                            >
                                Sensor contribution
                            </Header>}>
                                <SensorContribution range={range} />
                            </Container>
                        </Grid>
                    </SpaceBetween>
                </ContentLayout>
            }
            navigation={<NavigationBar activeHref={`/online-monitoring/modelName/${modelName}/projectName/${projectName}`} />}
        />
    )
}

export default OnlineMonitoring