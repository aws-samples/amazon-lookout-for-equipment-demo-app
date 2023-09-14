// Imports:
import { useContext, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

// Cloudscape components:
import Alert             from "@cloudscape-design/components/alert"
import Box               from "@cloudscape-design/components/box"
import Button            from "@cloudscape-design/components/button"
import ColumnLayout      from "@cloudscape-design/components/column-layout"
import Container         from "@cloudscape-design/components/container"
import ExpandableSection from "@cloudscape-design/components/expandable-section"
import Header            from "@cloudscape-design/components/header"
import Link              from "@cloudscape-design/components/link"
import SpaceBetween      from "@cloudscape-design/components/space-between"

// App components:
import DatasetOverview from './DatasetOverview'
import DeleteProjectModal from './DeleteProjectModal'

// Contexts:
import HelpPanelContext from '../contexts/HelpPanelContext'
import ApiGatewayContext from '../contexts/ApiGatewayContext'

// Utils:
import { SamplingRate } from './projectDashboardUtils'

// --------------------------
// Component main entry point
// --------------------------
function DatasetSummary({ modelDetails }) {
    const [ showDeleteProjectModal, setShowDeleteProjectModal ] = useState(false)
    const [ showUserGuide, setShowUserGuide ] = useState(true)
    const { projectName } = useParams()
    const { setHelpPanelOpen } = useContext(HelpPanelContext)
    const { showHelp } = useContext(ApiGatewayContext)
    const navigate = useNavigate()

    // Links to other pages of the app:
    const sensorOverviewLink = <Link 
        href={`/sensor-overview/ProjectName/${projectName}`}
        onFollow={(e) => { 
            e.preventDefault()
            navigate(`/sensor-overview/ProjectName/${projectName}`)
        }}>Sensor overview</Link>

    const labelingLink = <Link 
        href={`/labeling/ProjectName/${projectName}`}
        onFollow={(e) => { 
            e.preventDefault()
            navigate(`/labeling/ProjectName/${projectName}`)
        }}>Labelling</Link>

    const modelTrainingLink = <Link 
        href={`/model-training/ProjectName/${projectName}`}
        onFollow={(e) => { 
            e.preventDefault()
            navigate(`/model-training/ProjectName/${projectName}`)
        }}>Model training</Link>
    
    // Render the component:
    return (
        <SpaceBetween size="l">
            { showHelp.current && showUserGuide && <Container>
                <Alert dismissible={true} onDismiss={() => setShowUserGuide(false)}>
                    <p>
                        You can use this screen to verify that your dataset was correctly ingested and that 
                        its content is aligned with your expectations. Use the <b>summary</b> below to double check
                        the start and end date of your dataset, the number of sensors and the number of rows.
                        Expand the <b>Dataset overview</b> section to verify your column names, number format,
                        location of the timestamp column (it should be the first one), format of the timestamp 
                        column... If something seems odd, you can use the <b>Delete project</b> button to remove
                        it from this application: this will also remove any related asset (such as models and
                        deployments).
                    </p>
                    
                    <ul>
                        <li>For more details on the individual sensor data you can go to the <b>{sensorOverviewLink}</b> panel.</li>
                        <li>If you want to label historical events you are aware of, you can go to the <b>{labelingLink}</b> panel.</li>
                        <li>If you're ready to train a model based on this dataset you can go to the <b>{modelTrainingLink}</b> panel.</li>
                    </ul>

                    <p>
                        Once you train and deploy live models, an <b>online monitoring</b> section will also be displayed 
                        at the bottom of this page: it will give you a quick overview of the health status of the
                        assets or processes monitored.
                    </p>
                </Alert>
            </Container> }

            <Container 
                header={<Header 
                            variant="h1"
                            actions={<Button iconName="status-negative" onClick={() => setShowDeleteProjectModal(true)}>Delete project</Button>}
                            info={ <Link variant="info" onFollow={() => setHelpPanelOpen({
                                status: true,
                                page: 'projectDashboard',
                                section: 'summary'
                            })}>Info</Link> }
                        >Summary</Header>}
                footer={
                    <ExpandableSection 
                        headerText={
                            <Header 
                                variant="h4"
                                info={
                                    <Link variant="info" onFollow={() => setHelpPanelOpen({
                                        status: true,
                                        page: 'projectDashboard',
                                        section: 'datasetOverview'
                                    })}>Info</Link>
                                }
                            >
                                Dataset overview
                            </Header>}
                        variant="footer"
                    >
                        <DatasetOverview modelDetails={modelDetails} />
                    </ExpandableSection>
                }
            >
                <DeleteProjectModal
                    visible={showDeleteProjectModal}
                    onDiscard={() => { setShowDeleteProjectModal(false) }}
                    currentProjectName={projectName} />

                <ColumnLayout columns={2} variant="text-grid">
                    <SpaceBetween size="l">
                        <div>
                            <Box variant="awsui-key-label">Sensors</Box>
                            <div>{modelDetails && modelDetails.numSensors - 4} attributes found</div>
                        </div>
                        <div>
                            <Box variant="awsui-key-label">Timerange</Box>
                            <div>
                                from&nbsp;
                                <b>{modelDetails && modelDetails.startDate}</b> to&nbsp;
                                <b>{modelDetails && modelDetails.endDate}</b>
                            </div>
                        </div>
                        <div>
                            <Box variant="awsui-key-label">Asset / process description</Box>
                            <div>{modelDetails && modelDetails.assetDescription}</div>
                        </div>
                    </SpaceBetween>

                    <SpaceBetween size="l">
                        <div>
                            <Box variant="awsui-key-label">Dataset size</Box>
                            <div>
                                {modelDetails && parseFloat(modelDetails['rowCounts']).toLocaleString('en-US')} rows
                            </div>
                        </div>
                        <div>
                            <Box variant="awsui-key-label">Average sampling rate</Box>
                            <SamplingRate
                                rowCounts={modelDetails && modelDetails['rowCounts']}
                                startDate={modelDetails && modelDetails['startDate']}
                                endDate={modelDetails && modelDetails['endDate']} />
                        </div>
                    </SpaceBetween>
                </ColumnLayout>
            </Container>
        </SpaceBetween>
    )
}

export default DatasetSummary