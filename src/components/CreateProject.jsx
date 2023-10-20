// Imports:
import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from "react-router-dom"

// Utils:
import { checkProjectNameValidity, checkAssetDescriptionValidity } from './createProject/createProjectUtils.js'
import { getAvailableDefaultProjectName } from '../utils/utils.js'

// Application components:
import CSVUpload from "./createProject/CSVUpload.jsx"

// CloudScape components:
import Alert            from "@cloudscape-design/components/alert"
import Box              from "@cloudscape-design/components/box"
import Button           from "@cloudscape-design/components/button"
import Container        from "@cloudscape-design/components/container"
import ContentLayout    from "@cloudscape-design/components/content-layout"
import Form             from "@cloudscape-design/components/form"
import FormField        from "@cloudscape-design/components/form-field"
import Header           from "@cloudscape-design/components/header"
import Input            from "@cloudscape-design/components/input"
import Select           from "@cloudscape-design/components/select"
import SpaceBetween     from "@cloudscape-design/components/space-between"

// Context:
import ApiGatewayContext from './contexts/ApiGatewayContext.jsx'

// ==================================================
// Component main entry point: this component manages 
// the Create Project form where a user can create a 
// new project:
// ==================================================
function CreateProject() {
    const [ projectName, setProjectName ]               = useState("")
    const [ uploadInProgress, setUploadInProgress ]     = useState(false)
    const [ errorMessage, setErrorMessage ]             = useState(undefined)
    const [ projectNameError, setProjectNameError ]     = useState("")
    const [ assetError, setAssetError ]                 = useState("")
    const [ assetDescription, setAssetDescription ]     = useState("")

    const csvUploadRef = useRef(undefined)

    const { gateway, uid } = useContext(ApiGatewayContext)
    const navigate = useNavigate()

    // ----------------------------------------------------------------
    // Action triggered when the user submits the project creation form
    // ----------------------------------------------------------------
    const handleCreateProjectSubmit = async (e) => {
        e.preventDefault()
        await csvUploadRef.current.processCsvUpload()
    }

    // -----------------------------------------------------------
    // Sets a default project name when initializing the component
    // -----------------------------------------------------------
    useEffect(() => {
        getAvailableDefaultProjectName(gateway, uid)
        .then((x) => setProjectName(x))
    }, [gateway])

    // ---------------------
    // Render the component:
    // ---------------------
    return (
        <ContentLayout header={<Header variant="h1">Create a new project</Header>}>
            <form onSubmit={handleCreateProjectSubmit}>
                <Form
                    actions={
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button 
                            variant="link" 
                            disabled={uploadInProgress} 
                            onClick={
                                (e) => {
                                    e.preventDefault()
                                    navigate('/')
                                }
                            }
                        >Cancel</Button>
                        <Button variant="primary" disabled={uploadInProgress || projectNameError !== "" || assetError !== ""}>Create project</Button>
                    </SpaceBetween>
                    }
                >
                    <SpaceBetween size="xl">
                        <Container header={<Header variant="h2">Project details</Header>}>
                            <SpaceBetween size="l">
                                { errorMessage && <Alert type="error">{errorMessage}</Alert> }

                                <FormField 
                                    label="Project name"
                                    constraintText={projectNameError !== "" ? projectNameError : ""}
                                >
                                    <SpaceBetween size="xs">
                                        <Box>
                                            To get started, you will need to create a project: in this application, a project 
                                            holds your dataset, your models and all the associated results. You can keep the
                                            default name suggested below or customize it:
                                        </Box>
                                        <Input
                                            onChange={({detail}) => {
                                                const checkError = checkProjectNameValidity(detail.value, setProjectNameError, gateway, uid)
                                                setProjectName(detail.value)
                                                if (!checkError) { setErrorMessage("") }
                                            }}
                                            autoFocus={true}
                                            value={projectName}
                                            invalid={projectNameError !== ""}
                                            placeholder="Enter a project name"
                                        />
                                    </SpaceBetween>
                                </FormField>

                                <FormField 
                                    label="Asset or process description"
                                    constraintText={assetError !== "" ? assetError : ""}
                                >
                                    <SpaceBetween size="xs">
                                        <Box>
                                            What type of asset will you monitor within this project? This can be a piece of equipment,
                                            a production line, a manufacturing process, a shop floor area...
                                        </Box>
                                        <Input
                                            onChange={({detail}) => {
                                                checkAssetDescriptionValidity(detail.value, setAssetError)
                                                setAssetDescription(detail.value)
                                            }}
                                            value={assetDescription}
                                            invalid={assetError !== ""}
                                            placeholder="Enter a description for the process or asset you want to monitor"
                                        />
                                    </SpaceBetween>

                                </FormField>
                            </SpaceBetween>
                        </Container>

                        <Container>
                            <SpaceBetween size="l">
                                <FormField label="Select a dataset importing method">
                                    <Select 
                                        options={[
                                            {
                                                label: 'CSV File',
                                                description: 'Upload a CSV file from your computer',
                                                iconName: 'upload',
                                                value: 'csv-upload'
                                            },
                                            {
                                                label: 'ZIP Archive',
                                                description: 'Upload a collection of CSV files zipped in an archive from your computer',
                                                iconName: 'folder',
                                                value: 'zip-upload'
                                            },
                                            {
                                                label: 'CSV File on S3',
                                                description: 'Pick a CSV file from Amazon S3',
                                                iconUrl: 's3-icon-32.png',
                                                value: 'csv-s3'
                                            },
                                            {
                                                label: 'ZIP Archive on S3',
                                                description: 'Pick a ZIP archive from Amazon S3',
                                                iconUrl: 's3-objects-icon-32.png',
                                                value: 'zip-s3'
                                            },
                                            {
                                                label: 'Timestream Table',
                                                description: 'Extract a subset of a Amazon Timestream table',
                                                iconUrl: 'timestream-icon-32.png',
                                                value: 'timestream'
                                            }
                                        ]}
                                    />
                                </FormField>

                                <CSVUpload 
                                    ref={csvUploadRef}
                                    setUploadInProgress={setUploadInProgress}
                                    setAssetError={setAssetError}
                                    setErrorMessage={setErrorMessage}
                                    assetDescription={assetDescription}
                                    projectName={projectName}
                                />
                            </SpaceBetween>
                        </Container>
                    </SpaceBetween>
                </Form>
            </form>
        </ContentLayout>
    )
}

export default CreateProject