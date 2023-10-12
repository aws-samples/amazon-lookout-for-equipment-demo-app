// Cloudscape components:
import Box               from "@cloudscape-design/components/box"
import Button            from "@cloudscape-design/components/button"
import Container         from "@cloudscape-design/components/container"
import ContentLayout     from "@cloudscape-design/components/content-layout"
import ExpandableSection from "@cloudscape-design/components/expandable-section"
import Header            from "@cloudscape-design/components/header"
import Link              from "@cloudscape-design/components/link"
import SpaceBetween      from "@cloudscape-design/components/space-between"

function Welcome() {
    return (
        <ContentLayout header={<Header variant="h1">Welcome!</Header>}>
            <Container header={<Header variant="h2">Application overview</Header>}>
                <SpaceBetween size="xl">
                    <Box>
                        This application will help you assess quickly if your industrial data contains any
                        historical anomaly of interest. After you upload a dataset containing sensor measurements
                        from your industrial equipment or manufacturing process, you will be guided to train
                        an anomaly detection model. You will then be able to visualize your model results and deploy 
                        it, making it ready to receive your shop floor live data. This application also includes an
                        operational dashboard to visualize your live results.
                    </Box>
                    <Box>
                        The following diagram illustrate the workflow you will follow to train and deploy your 
                        first model with this application (in the red frame below). The key steps are highlighted 
                        in the green boxes while the blue ones are optional:
                    </Box>

                    <Box textAlign="center">
                        <img src="/application-workflow-diagram.png" width="90%" />
                    </Box>

                    <Box>
                        To get started, you will need a single CSV file containing your sensor data. This data will
                        be structured with a <b>timestamp</b> in the first column and the <b>sensor data</b> in the 
                        remaining columns:
                    </Box>

                    <Box variant="code">
                        Timestamp,Sensor 1,Sensor 2<br />
                        2020-01-01 00:00:00,2,12<br />
                        2020-01-01 00:05:00,3,11<br />
                        2020-01-01 00:10:00,5,10<br />
                        2020-01-01 00:15:00,3,16<br />
                        2020-01-01 00:20:00,4,12<br />
                    </Box>

                    <Box>
                        Ideally, you need to <b>collect between 6 months and 1 year</b> of data, but a minimum of 14 days
                        is currently mandatory to train a relevant model. The recommended sampling rate should be in the range
                        of <b>10 seconds</b> to <b>1 hour</b>. Once you are ready, click the button below to start your journey 
                        and upload your data into a new project.
                    </Box>

                    <Box>
                        You can choose your column names. We recommend using "Timestamp" as the name for the column with the 
                        time series data.&nbsp;
                        
                        
                        <Link 
                            href="https://docs.aws.amazon.com/lookout-for-equipment/latest/ug/formatting-data.html" 
                            target="_blank"
                            external={true}
                        >
                            <b>Check the documentation</b>
                        </Link>

                        &nbsp;for the allowed formats of the timestamp column.
                        You must have a double (numerical) as the data type for your sensor data. You can only train your model 
                        on numeric data. The valid characters that you can use in the column names of the dataset are A-Z, a-z, 
                        0-9, . (dot), _ (underscore) and - (hyphen).
                    </Box>

                    <Box float="right">
                        <Link to='/create-project'>
                            <Button variant="primary">Load data and build your first model</Button>
                        </Link>
                    </Box>

                    <ExpandableSection headerText="Click here to learn more...">
                        <SpaceBetween size="xl">
                            
                            <Box>
                                <Header variant="h4">Technology</Header>
                                <p>
                                    In the backend, this application leverages Amazon Lookout for Equipment, an AI/ML service
                                    hosted on the AWS cloud. Lookout for Equipment is an ML industrial equipment and process 
                                    monitoring service that detects abnormal behaviors so you can act and avoid unplanned 
                                    downtime or undesirable  process quality outcomes. The following diagram describes how
                                    this service operates at a high level:
                                </p>
                            </Box>
                            <Box textAlign="center">
                                <img src="/service-diagram.png" width="90%" />
                            </Box>

                            <Box>
                                <Header variant="h4">Applications</Header>
                                <p>
                                    Lookout for Equipment is designed to monitor fixed and stationary industrial equipment that operates 
                                    continuously, with limited variability in operating conditions. This includes rotating equipment such 
                                    as pumps, compressors, motors, fans, gearboxes and turbines. The service has also been successful at 
                                    predicting failures in computer numerical control (CNC) machines operations. It is also targeted for 
                                    process industries with applications such as heat exchangers, boilers, or inverters. Also many customers 
                                    use this service to supplement their predictive maintenance practice, it can also target predictive 
                                    quality use cases.
                                </p>
                                
                                <p>
                                    Lookout for Equipment  may not be ideal for equipment or process with significantly variable operating 
                                    conditions, such as highly variable processes, vehicles, robots, or appliances.
                                </p>
                            </Box>
                        </SpaceBetween>
                    </ExpandableSection>
        

                </SpaceBetween>
            </Container>
        </ContentLayout>
    )
}

export default Welcome