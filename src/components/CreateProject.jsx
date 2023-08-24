// Imports:
import { Storage } from 'aws-amplify'
import { useContext, useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom"
import { 
    getHumanReadableSize, 
    checkProjectNameAvailability, 
    waitForPipelineStart,
    getAvailableDefaultProjectName
} from '../utils/utils.js'

// Application components:
import NavigationBar from './NavigationBar'
import HelpSidePanel from './shared/HelpSidePanel'

// CloudScape components:
import AppLayout        from "@cloudscape-design/components/app-layout"
import Alert            from "@cloudscape-design/components/alert"
import Box           from "@cloudscape-design/components/box"
import Button           from "@cloudscape-design/components/button"
import Container        from "@cloudscape-design/components/container"
import ContentLayout    from "@cloudscape-design/components/content-layout"
import FileUpload       from "@cloudscape-design/components/file-upload"
import Flashbar         from "@cloudscape-design/components/flashbar"
import Form             from "@cloudscape-design/components/form"
import FormField        from "@cloudscape-design/components/form-field"
import Header           from "@cloudscape-design/components/header"
import Input            from "@cloudscape-design/components/input"
import Link             from "@cloudscape-design/components/link"
import ProgressBar      from "@cloudscape-design/components/progress-bar"
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
    const [ dataset, setDataset ]                       = useState([])
    const [ progressPercent, setProgressPercent ]       = useState(0)
    const [ bytesTransferred, setBytesTransferred ]     = useState("0 bytes loaded")
    const [ filename, setFilename ]                     = useState("")
    const [ uploadInProgress, setUploadInProgress ]     = useState(false)
    const [ errorMessage, setErrorMessage ]             = useState(undefined)
    const [ helpPanelOpen, setHelpPanelOpen ]           = useState(false)
    const [ showFlashbar, setShowFlashbar ]             = useState(false)
    const [ defaultProjectName, setDefaultProjectName ] = useState("")

    const { gateway, uid, navbarCounter, setNavbarCounter } = useContext(ApiGatewayContext)
    const navigate = useNavigate()

    // --------------------------------------
    // Called while a file is pushed to S3 to 
    // provide feedback to the user during an 
    // upload:
    // --------------------------------------
    const progressCallback = (progress) => {
        if (!progress['timeStamp']) {
            setProgressPercent(parseInt(progress.loaded / progress.total * 100))
            setBytesTransferred(`${getHumanReadableSize(progress.loaded)} bytes loaded`)            
        }
        else {
            setProgressPercent(100)
            setBytesTransferred('Done')
        }
    }

    // -----------------------
    // Uploading a file to S3:
    // -----------------------
    const uploadFileToS3 = async (prefix, file) => {
        try {
            setFilename(file.name)
            setUploadInProgress(true)
            await Storage.put(
                prefix + '/' + prefix + '/sensors.csv', 
                file,
                { 
                    contentType: file.type,
                    level: "private",
                    tagging: `L4EDemoAppUser=${uid}`,
                    progressCallback
                }
            )
        }
        catch (error) {
            console.log("Error uploading file:", error.response);
        }
    }

    // ------------------------------------------------------------
    // Action triggered when the user submits the project creation
    // form: we upload the file to S3, show a progress bar and then 
    // navigate back to the welcome screen:
    // ------------------------------------------------------------
    const handleCreateProjectSubmit = async (e) => {
        e.preventDefault()
        let currentError = ""

        // Error checking:
        if (projectName.length <= 2) {
            currentError = 'Project name must be at least 3 characters long'
        }
        else if (! /^([a-zA-Z0-9_\-]{1,170})$/.test(projectName)) {
            currentError = 'Project name can have up to 170 characters. Valid characters are a-z, A-Z, 0-9, _ (underscore), and - (hyphen)'
        }
        else if (dataset.length < 1) {
            currentError = 'You must select a file to upload'
        }
        else if (! await checkProjectNameAvailability(projectName, gateway, uid)) {
            currentError = 'Project name not available'
        }

        if (currentError === "") {
            // Upload the file and wait for the processing
            // pipeline to kick in:
            setErrorMessage("")
            await uploadFileToS3(projectName, dataset[0])
            setShowFlashbar(true)
            await waitForPipelineStart(gateway, uid, projectName)

            // This forces a refresh of the side bar navigation
            // so we can see the new project name popping up:
            setNavbarCounter(navbarCounter + 1)

            // Redirects to the dashboard for the new project:
            navigate(`/project-dashboard/projectName/${projectName}`)
        }
        else {
            setErrorMessage(currentError)
        }
    }

    useEffect(() => {
        getAvailableDefaultProjectName(gateway, uid)
        .then((x) => setProjectName(x))
    }, [gateway])

    // ---------------------
    // Render the component:
    // ---------------------
    return (
        <AppLayout
            contentType="default"
            toolsOpen={helpPanelOpen}
            onToolsChange={(e) => setHelpPanelOpen(e.detail.open)}
            tools={
                <HelpSidePanel page="createProject" section="dataset" />
            }
            content={
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
                                <Button variant="primary" disabled={uploadInProgress}>Create project</Button>
                            </SpaceBetween>
                            }
                        >
                            <Container header={<Header variant="h2">Project details</Header>}>
                                <SpaceBetween size="l">
                                    <FormField 
                                        label="Project name"
                                        constraintText={"Project name can't contain \"/\""}
                                    >
                                        <SpaceBetween size="xs">
                                            <Box>
                                                To get started, you will need to create a project: in this application, a project 
                                                holds your dataset, your models and all the associated results. You can keep the
                                                default name suggested below or customize it:
                                            </Box>
                                            <Input
                                                onChange={({detail}) => setProjectName(detail.value)}
                                                value={projectName}
                                                placeholder="Enter a project name"
                                            />
                                        </SpaceBetween>
                                    </FormField>

                                    <FormField
                                        label="Dataset"
                                        info={ <Link variant="info" onFollow={() => setHelpPanelOpen(true)}>Info</Link> }
                                    >
                                        <SpaceBetween size="xs">
                                            <Box>
                                                Pick a dataset on your local computer to upload it. Keep in mind that at least <b>90 days</b> of 
                                                data will be needed to train a model further down the road:
                                            </Box>
                                            <FileUpload
                                                onChange={({ detail }) => setDataset(detail.value)}
                                                value={dataset}
                                                i18nStrings={{
                                                    uploadButtonText: e => "Choose file",
                                                    removeFileAriaLabel: e => `Remove file ${e + 1}`,
                                                }}
                                                showFileLastModified={true}
                                                showFileSize={true}
                                                tokenLimit={1}
                                                constraintText="Upload a single CSV file containing the sensors data for an individual piece of 
                                                                equipment or process. Your file must have a tabular format with a timestamp in the
                                                                first column and the other columns holding your sensor data. Use the info link
                                                                above to get more details about the expected file format."
                                            />
                                        </SpaceBetween>
                                    </FormField>

                                    
                                    { filename && 
                                        <FormField>
                                            <ProgressBar
                                                value={progressPercent}
                                                additionalInfo={bytesTransferred}
                                                description={`Uploading ${filename}`}
                                                label="File upload in progress"
                                            />
                                        </FormField>
                                    }
                                    

                                    { errorMessage && <Alert type="error">{errorMessage}</Alert> }

                                    { showFlashbar && <Flashbar items={[{
                                        type: 'info',
                                        loading: true,
                                        content: "Launching the ingestion pipeline: don't navigate away from this page, you will be automatically redirected to your new project dashboard in a few seconds."
                                    }]} /> }

                                    { !showFlashbar && <Alert>
                                        After the upload, your data is ingested and optimized for visualization purpose. You will be redirected to the project dashboard in the meantime.
                                    </Alert> }
                                </SpaceBetween>
                            </Container>
                        </Form>
                    </form>
                </ContentLayout>
            }
        navigation={<NavigationBar activeHref="/create-project" />}
    />

    )
}

export default CreateProject