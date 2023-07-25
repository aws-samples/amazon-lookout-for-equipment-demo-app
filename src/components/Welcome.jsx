// Imports:
import { Link } from "react-router-dom"
import NavigationBar from './NavigationBar'

// Cloudscape components:
import AppLayout        from "@cloudscape-design/components/app-layout"
import Box              from "@cloudscape-design/components/box"
import Button           from "@cloudscape-design/components/button"
import Container        from "@cloudscape-design/components/container"
import ContentLayout    from "@cloudscape-design/components/content-layout"
import Header           from "@cloudscape-design/components/header"
import SpaceBetween     from "@cloudscape-design/components/space-between"

function Welcome() {
    return (
        <AppLayout
            content={
                <ContentLayout header={<Header variant="h1">Welcome!</Header>}>
                    <Container>
                        <SpaceBetween size="xl">
                            <Box>
                                Amazon Lookout for Equipment is an ML industrial equipment and process monitoring service 
                                that detects abnormal behaviors so you can act and avoid unplanned downtime or undesirable 
                                process quality outcomes.
                            </Box>
                            <Box textAlign="center">
                                <img src="/service-diagram.png" width="90%" />
                            </Box>
                            <Box>
                                Welcome to Amazon Lookout for Equipment demonstration. The intent of this application is to
                                give you a feeling on how you can leverage this service to feed actionable insights into your
                                predictive maintenance and predictive quality practices.

                                You can get started in two ways: begin with our pretrained model to understand the capabilities 
                                of the product or load your own data and create your first model.
                            </Box>
                
                            <Box float="right">
                                <SpaceBetween direction="horizontal" size="xs">
                                    {/* <Link to='/model-dashboard?model-name=pretrained_model'> */}
                                        <Button variant="primary" disabled={true}>Pretrained model demonstration</Button>
                                    {/* </Link> */}
                
                                    <Link to='/create-project'>
                                        <Button variant="primary">Load data and build your first model</Button>
                                    </Link>
                                </SpaceBetween>
                            </Box>
                        </SpaceBetween>
                    </Container>
                </ContentLayout>
            }
            navigation={<NavigationBar activeHref="/" />}
        />
    )
}

export default Welcome