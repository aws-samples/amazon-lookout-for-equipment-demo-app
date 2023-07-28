// Imports:
import { Storage } from 'aws-amplify'
import { useState } from 'react'
import { useNavigate } from "react-router-dom"
import { getHumanReadableSize } from '../utils/utils.js'

// Application components:
import NavigationBar from './NavigationBar'

// CloudScape components:
import AppLayout        from "@cloudscape-design/components/app-layout"
import Button           from "@cloudscape-design/components/button"
import Container        from "@cloudscape-design/components/container"
import ContentLayout    from "@cloudscape-design/components/content-layout"
import FileUpload       from "@cloudscape-design/components/file-upload"
import Form             from "@cloudscape-design/components/form"
import FormField        from "@cloudscape-design/components/form-field"
import Header           from "@cloudscape-design/components/header"
import Input            from "@cloudscape-design/components/input"
import ProgressBar      from "@cloudscape-design/components/progress-bar"
import SpaceBetween     from "@cloudscape-design/components/space-between"

// ==================================================
// Component main entry point: this component manages 
// the Create Project form where a user can create a 
// new project:
// ==================================================
function CreateProject() {
    const [projectName, setProjectName]           = useState("")
    const [dataset, setDataset]                   = useState([])
    const [progressPercent, setProgressPercent]   = useState(0)
    const [bytesTransferred, setBytesTransferred] = useState("0 bytes loaded")
    const [filename, setFilename]                 = useState("")
    const [uploadInProgress, setUploadInProgress] = useState(false)

    const navigate = useNavigate()

    // Called while a file is pushed to S3 to 
    // provide feedback to the user during an 
    // upload:
    const progressCallback = (progress) => {
        if (!progress['timeStamp']) {
            setProgressPercent(parseInt(progress.loaded / progress.total * 100))
            setBytesTransferred(`${getHumanReadableSize(progress.loaded)} bytes loaded`)            
        }
        else {
            setProgressPercent(100)
            setBytesTransferred(`Done (${bytesTransferred})`)
        }
    }

    // Uploading a file to S3:
    const uploadFileToS3 = async (prefix, file) => {
        try {
            setFilename(file.name)
            setUploadInProgress(true)
            await Storage.put(
                prefix + '/' + prefix + '/' + file.name, 
                file,
                { 
                    contentType: file.type,
                    level: "private",
                    progressCallback
                }
            )
        }
        catch (error) {
            console.log("Error uploading file:", error.response);
        }
    }

    // Action triggered when the user submits the project creation
    // form: we upload the file to S3, show a progress bar and then 
    // navigate back to the welcome screen:
    const handleCreateProjectSubmit = async (e) => {
        e.preventDefault()
        await uploadFileToS3(projectName, dataset[0])
        navigate('/')
    }
    
    // Render the component:
    return (
        <AppLayout
            contentType="default"
            content={
                <ContentLayout header={<Header variant="h1">Create a new project</Header>}>
                    <form onSubmit={handleCreateProjectSubmit}>
                        <Form
                            actions={
                            <SpaceBetween direction="horizontal" size="xs">
                                <Button variant="link" disabled={uploadInProgress}>Cancel</Button>
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
                                            constraintText="Upload a single CSV file or a ZIP archive containing multiple CSV files"
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