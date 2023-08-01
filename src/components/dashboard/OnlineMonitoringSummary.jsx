// Imports:
import { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// CloudScape components:
import Box          from '@cloudscape-design/components/box'
import Button       from '@cloudscape-design/components/button'
import Cards        from '@cloudscape-design/components/cards'
import Container    from '@cloudscape-design/components/container'
import Header       from '@cloudscape-design/components/header'
import SpaceBetween from "@cloudscape-design/components/space-between"
import Tiles        from "@cloudscape-design/components/tiles"

// App components:
import ConditionOverview    from '../onlineMonitoring/ConditionOverview'

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext'

import { getAllModels, getAllSchedulers } from '../../utils/utils'

async function getSchedulerData(gateway, projects, uid) {
    const modelsList = await getAllModels(gateway, projects, uid)
    const schedulersList = await getAllSchedulers(gateway, modelsList)

    return schedulersList[projects[0]]
}

function OnlineMonitoringSummary({ projectName }) {
    const { gateway, uid } = useContext(ApiGatewayContext)
    const [ range, setRange] = useState("7")
    const [ modelsList, setModelsList ] = useState(undefined)
    const navigate = useNavigate()

    // Builds the hierarchy:
    useEffect(() => {
        getSchedulerData(gateway, [projectName], uid)
        .then((x) => setModelsList(x))
    }, [gateway, range, projectName])

    function viewModelDetails(e, modelName) {
        e.preventDefault()
        navigate(`/online-monitoring/modelName/${modelName}/projectName/${projectName}/initialRange/${range}`)
    }

    if (modelsList) {
        let cardItems = []

        modelsList.forEach((model) => {
            cardItems.push({
                name: model,
                description: <SpaceBetween size="xxxs">
                    <Box float="right">
                        <Button onClick={ (e) => viewModelDetails(e, model) } variant="link">View details</Button>
                    </Box>
                    <ConditionOverview 
                        range={range} 
                        modelName={model}
                        projectName={projectName}
                        size="large" 
                        hideTitles={true} 
                    />
                </SpaceBetween>
            })
        })

        // Render the component:
        return (
            <>
                <SpaceBetween size="xl">
                    <Container>
                        <Header 
                            variant="h2" 
                            description="This section gives a high level overview of the anomalies 
                                         detected by the models deployed for this specific project. 
                                         Change the period below to update the widgets accordingly"
                        >
                            Live results
                        </Header>
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

                    <Cards 
                        cardDefinition={{
                            header: item => <Header variant="h2">{item.name}</Header>,
                            sections: [
                                {
                                    id: "description",
                                    content: item => item.description
                                }
                            ]
                        }}
                        cardsPerRow={[
                            { cards: 1 },
                            { minWidth: 300, cards: 3 }
                        ]}
                        items={cardItems}
                    />

                </SpaceBetween>
            </>
        )
    }
}

export default OnlineMonitoringSummary