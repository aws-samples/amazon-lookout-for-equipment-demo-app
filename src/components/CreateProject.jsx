// Imports:
import { Storage } from 'aws-amplify'
import { useContext, useState } from 'react'
import { useNavigate } from "react-router-dom"
import { getHumanReadableSize, checkProjectNameAvailability, waitForPipelineStart } from '../utils/utils.js'

// Application components:
import NavigationBar from './NavigationBar'
import HelpSidePanel from './shared/HelpSidePanel'

// CloudScape components:
import AppLayout        from "@cloudscape-design/components/app-layout"
import Alert            from "@cloudscape-design/components/alert"
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
    const [ projectName, setProjectName ]           = useState("")
    const [ dataset, setDataset ]                   = useState([])
    const [ progressPercent, setProgressPercent ]   = useState(0)
    const [ bytesTransferred, setBytesTransferred ] = useState("0 bytes loaded")
    const [ filename, setFilename ]                 = useState("")
    const [ uploadInProgress, setUploadInProgress ] = useState(false)
    const [ errorMessage, setErrorMessage ]         = useState("")
    const [ helpPanelOpen, setHelpPanelOpen ]       = useState(false)
    const [ showFlashbar, setShowFlashbar ]         = useState(false)

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
        else if (! await checkProjectNameAvailability(projectName, gateway, uid)) {
            currentError = 'Project name not available'
        }
        else if (dataset.length < 1) {
            currentError = 'You must select a file to upload'
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
                                <SpaceBetween size="xl">
                                    <FormField 
                                        label="Project name"
                                        constraintText={"Project name can't contain \"/\""}
                                    >
                                        <Input
                                            onChange={({detail}) => setProjectName(detail.value)}
                                            value={projectName}
                                            placeholder="Enter a project name"
                                        />
                                    </FormField>

                                    <FormField
                                        label="Dataset"
                                        description="Pick a dataset on your local computer to upload it"
                                        info={ <Link variant="info" onFollow={() => setHelpPanelOpen(true)}>Info</Link> }
                                    >
                                        <FileUpload
                                            onChange={({ detail }) => setDataset(detail.value)}
                                            value={dataset}
                                            i18nStrings={{
                                                uploadButtonText: e => "Choose file",
                                                removeFileAriaLabel: e => `Remove file ${e + 1}`,
                                            }}
                                            showFileLastModified
                                            showFileSize
                                            tokenLimit={1}
                                            constraintText="Upload a single CSV file containing the sensors data for an individual asset"
                                        />
                                    </FormField>

                                    <FormField>
                                        { filename && 
                                            <ProgressBar
                                                value={progressPercent}
                                                additionalInfo={bytesTransferred}
                                                description={`Uploading ${filename}`}
                                                label="File upload in progress"
                                            />
                                        }
                                    </FormField>

                                    { errorMessage && <Alert type="error">{errorMessage}</Alert> }

                                    { showFlashbar && <Flashbar items={[{
                                        type: 'info',
                                        loading: true,
                                        content: "Launching the ingestion pipeline: don't navigate away from this page, you will be automatically redirected to your new project dashboard in a few seconds."
                                    }]} />}
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