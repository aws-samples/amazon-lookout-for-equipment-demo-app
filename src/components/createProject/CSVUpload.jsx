// Imports:
import { Storage, Auth } from 'aws-amplify'
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react'
import { useNavigate } from "react-router-dom"

// CloudScape components:
import Alert            from "@cloudscape-design/components/alert"
import Box              from "@cloudscape-design/components/box"
import FileUpload       from "@cloudscape-design/components/file-upload"
import Flashbar         from "@cloudscape-design/components/flashbar"
import FormField        from "@cloudscape-design/components/form-field"
import Link             from "@cloudscape-design/components/link"
import ProgressBar      from "@cloudscape-design/components/progress-bar"
import SpaceBetween     from "@cloudscape-design/components/space-between"

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext.jsx'
import HelpPanelContext from '../contexts/HelpPanelContext'

// Utils:
import { getHumanReadableSize, checkProjectNameAvailability, waitForPipelineStart } from '../../utils/utils.js'
import { checkAssetDescriptionValidity } from './createProjectUtils.js'

// --------------------------
// Component main entry point
// --------------------------
const CSVUpload = forwardRef(function CSVUpload(props, ref) {
    const [ dataset, setDataset ]                       = useState([])
    const [ progressPercent, setProgressPercent ]       = useState(0)
    const [ bytesTransferred, setBytesTransferred ]     = useState("0 bytes loaded")
    const [ filename, setFilename ]                     = useState(undefined)
    const [ showFlashbar, setShowFlashbar ]             = useState(false)
    const [ identityId, setIdentityId ]                 = useState("")

    const setUploadInProgress = props.setUploadInProgress
    const projectName         = props.projectName
    const setAssetError       = props.setAssetError
    const assetDescription    = props.assetDescription
    const setErrorMessage     = props.setErrorMessage

    const { gateway, uid, navbarCounter, setNavbarCounter } = useContext(ApiGatewayContext)
    const { setHelpPanelOpen } = useContext(HelpPanelContext)
    const navigate = useNavigate()

    useEffect(() => {
        Auth.currentUserCredentials()
        .then((credentials) => setIdentityId(credentials.identityId))
    })

    // -----------------------
    // Uploading a file to S3:
    // -----------------------
    function uploadFileToS3(prefix, file) {
        try {
            setFilename(file.name)
            setUploadInProgress(true)

            const upload = Storage.put(
                prefix + '/' + prefix + '/sensors.csv', 
                file,
                { 
                    contentType: file.type,
                    level: "private",
                    tagging: `L4EDemoAppUser=${uid}&AssetDescription=${assetDescription}`,
                    resumable: true,
                    progressCallback(progress) {
                        if (!progress['timeStamp']) {
                            setProgressPercent(parseInt(progress.loaded / progress.total * 100))
                            setBytesTransferred(`${getHumanReadableSize(progress.loaded)} bytes loaded`)
                        }
                        else {
                            setProgressPercent(100)
                            setBytesTransferred('Done')
                        }
                    },
                    completeCallback: async () => {
                        setShowFlashbar(true)

                        // We will also trigger a Step Function that will 
                        // ingest the data once upload is finished:
                        const sfnArn = window.datasetPreparationArn
                        const inputPayload = { 
                            detail: {
                                bucket: { name: upload.params.Bucket },
                                object: { key: `private/${identityId}/${upload.params.Key}` }
                            }
                        }
                        await gateway.stepFunctions
                                    .startExecution(sfnArn, inputPayload)
                                    .catch((error) => console.log(error.response))
                        await waitForPipelineStart(gateway, uid, projectName)

                        // This forces a refresh of the side bar navigation
                        // so we can see the new project name popping up:
                        setNavbarCounter(navbarCounter + 1)

                        // Redirects to the dashboard for the new project:
                        navigate(`/project-dashboard/projectName/${projectName}`)
                    }
                }
            )
        }
        catch (error) {
            console.log("Error uploading file:", error, error.response);
        }
    }

    // ------------------------------------------------------------
    // Action triggered when the user submits the project creation
    // form: we upload the file to S3, show a progress bar and then 
    // navigate back to the welcome screen.
    //
    // This function will be triggered by the parent component.
    // ------------------------------------------------------------
    useImperativeHandle(ref, () => ({
        async processCsvUpload () {
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
            else if (!await checkProjectNameAvailability(projectName, gateway, uid)) {
                currentError = 'Project name not available'
            }
            else if (checkAssetDescriptionValidity(assetDescription, setAssetError)) {
                currentError = 'Asset / process description is invalid'
            }
    
            if (currentError === "") {
                // Upload the file and wait for the processing pipeline to kick in:
                setErrorMessage("")
                uploadFileToS3(projectName, dataset[0])
            }
            else {
                setErrorMessage(currentError)
            }
        }
    }))

    // --------------------------------
    // Renders the CSV Upload component
    // --------------------------------
    return (<SpaceBetween size="l">
        <FormField
            label="Dataset"
            info={ <Link variant="info" onFollow={() => setHelpPanelOpen({
                status: true,
                page: 'createProject',
                section: 'dataset'
            })}>Info</Link> }
        >
            <SpaceBetween size="xs">
                <Box>
                    Pick a dataset on your local computer to upload it. Keep in mind that at least <b>14 days</b> of 
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

        { filename && <FormField>
            <ProgressBar
                value={progressPercent}
                additionalInfo={bytesTransferred}
                description={`Uploading ${filename}`}
                label="File upload in progress"
            />
        </FormField> }

        { showFlashbar && <Flashbar items={[{
            type: 'info',
            loading: true,
            content: "Launching the ingestion pipeline: don't navigate away from this page, you will be automatically redirected to your new project dashboard in a few seconds."
        }]} /> }

        { !showFlashbar && <Alert>
            After the upload, your data is ingested and optimized for visualization purpose. You will be redirected to the project dashboard in the meantime.
        </Alert> }
    </SpaceBetween>)
})

export default CSVUpload