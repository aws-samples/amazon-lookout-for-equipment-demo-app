// Imports:
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from "react"
import { useNavigate } from 'react-router-dom'
import { Auth } from 'aws-amplify'

// Cloudscape components:
import Alert              from "@cloudscape-design/components/alert"
import Flashbar           from "@cloudscape-design/components/flashbar"
import FormField          from "@cloudscape-design/components/form-field"
import Input              from "@cloudscape-design/components/input"
import RadioGroup         from "@cloudscape-design/components/radio-group"
import S3ResourceSelector from "@cloudscape-design/components/s3-resource-selector"
import SpaceBetween       from "@cloudscape-design/components/space-between"

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext.jsx'

// Utils:
import { getListBuckets, getListObjects, copyCsvFromS3 } from "../../utils/api.js"
import { waitForPipelineStart } from '../../utils/utils.js'
import { checkProjectNameValidity, checkAssetDescriptionValidity } from './createProjectUtils.js'

// --------------------------
// Component main entry point
// --------------------------
const CSVFromS3 = forwardRef(function CSVFromS3(props, ref) {
    // Component state definition:
    const projectName         = props.projectName
    const assetDescription    = props.assetDescription
    const setUploadInProgress = props.setUploadInProgress
    const setErrorMessage     = props.setErrorMessage
    const errorMessage        = props.errorMessage
    const setAssetError       = props.setAssetError

    const [ identityId, setIdentityId ] = useState("")
    const [ s3Resource, setS3Resource ] = useState({ uri: "" })
    const [ permissionCreationMethod, setPermissionCreationMethod ] = useState("new-role")
    const [ IAMRoleArn, setIAMRoleArn ] = useState(undefined)
    const [ showFlashbar, setShowFlashbar ] = useState(false)
    const [ showCopyInProgress, setShowCopyInProgress ] = useState(false)

    const { gateway, uid, navbarCounter, setNavbarCounter } = useContext(ApiGatewayContext)
    const navigate = useNavigate()

    // Collect user credentials
    useEffect(() => {
        Auth.currentUserCredentials()
        .then((credentials) => setIdentityId(credentials.identityId))
    })

    // ------------------------------------------------------------
    // Action triggered when the user submits the project creation
    // form: we copy the file from the S3 location picked by the 
    // user to the S3 bucket managed by this application.
    //
    // This function will be triggered by the parent component.
    // ------------------------------------------------------------
    useImperativeHandle(ref, () => ({
        async processCsvFromS3() {
            // Error checking:
            let currentError = ""
            let { error, errorMessage } = await checkProjectNameValidity(projectName, undefined, gateway, uid)
            if (error) {
                currentError = errorMessage
            }
            else if (checkAssetDescriptionValidity(assetDescription, setAssetError)) {
                currentError = 'Asset / process description is invalid'
            }
            else if (s3Resource.uri === "") {
                currentError = 'No S3 resource selected'
            }
            else if (! /^(s3:\/\/([^/]+)\/(.*?([^\/]+)\/?))$/.test(s3Resource.uri)) {
                currentError = 'Invalid S3 path'
            }
            else if (permissionCreationMethod == 'iam-arn' && !IAMRoleArn) {
                currentError = 'No IAM role ARN given'
            }
            else if (permissionCreationMethod == 'iam-arn' && ! /^(arn:aws:iam::(\d{12}):role\/([A-z0-9\-\+\.=@,_]+?))$/.test(IAMRoleArn)) {
                currentError = 'Invalid IAM Arn'
            }

            // No error detected, we can proceed with the project creation:
            if (currentError === "") {
                setErrorMessage("")
                setUploadInProgress(true)
                setShowFlashbar(true)

                // Copy from S3 parameters:
                const sourceBucket = s3Resource.uri.split('/')[2]
                let sourcePrefix = s3Resource.uri.split('/')
                sourcePrefix = sourcePrefix.slice(3, sourcePrefix.length).join('/')
                const targetBucket = window.appS3Bucket
                const targetPrefix = `private/${identityId}/${projectName}/${projectName}/sensors.csv`

                // We will now trigger a Step Function that will 
                // copy the file from its source location and 
                // ingest the data once the copy is finished:                
                await copyCsvFromS3(
                    sourceBucket, 
                    sourcePrefix, 
                    targetBucket, 
                    targetPrefix,
                    permissionCreationMethod === 'new-role' ? true : false,
                    IAMRoleArn,
                    uid,
                    assetDescription
                )
                await waitForPipelineStart(gateway, uid, projectName)

                // This forces a refresh of the side bar navigation
                // so we can see the new project name popping up:
                setNavbarCounter(navbarCounter + 1)

                // Redirects to the dashboard for the new project:
                navigate(`/project-dashboard/projectName/${projectName}`)
            }

            // An error is detected, we display the 
            // corresponding message back to the user:
            else {
                setErrorMessage(currentError)
            }
        }
    }))

    // ---------
    // Rendering
    // ---------
    return (
        <SpaceBetween size="xl">
            <S3ResourceSelector
                onChange={({ detail }) => setS3Resource(detail.resource) }
                resource={s3Resource}
                selectableItemsTypes={["objects"]}
                fetchBuckets={getListBuckets}
                fetchObjects={(bucketName, pathPrefix) => getListObjects(bucketName, pathPrefix)}
                invalid={errorMessage && s3Resource.uri === ''}
            />

            <FormField label="Access permission" description="This application requires permission to access your data in Amazon S3">
                <SpaceBetween size="xl">
                    <RadioGroup
                        onChange={({ detail }) => setPermissionCreationMethod(detail.value)}
                        value={permissionCreationMethod}
                        items={[
                            { 
                                label: "Create a new role", 
                                value: "new-role",
                                description: `The application will create an IAM role on your behalf on only grant it 
                                              permission to access the file you selected above. This temporary role 
                                              will be deleted after usage.`
                            },
                            { 
                                label: "Enter a custom IAM role ARN", 
                                value: "iam-arn",
                                description: `If you already have a role with the appropriate permissions to access the
                                              file selected above, you can fill it's identification number (ARN) in.`
                            }
                        ]}
                    />

                    { permissionCreationMethod == 'iam-arn' && 
                        <FormField label="Role ARN">
                            <Input 
                                onChange={({ detail }) => setIAMRoleArn(detail.value)}
                                value={IAMRoleArn}
                                placeholder='arn:aws:iam::112233344:role/my-role'
                                invalid={errorMessage && !IAMRoleArn}
                            />
                        </FormField>
                    }
                </SpaceBetween>
            </FormField>

            { showFlashbar && <Flashbar items={[{
                type: 'info',
                loading: true,
                content: `Launching the extraction and ingestion pipeline: don't navigate away from this page,
                          you will be automatically redirected to your new project dashboard in a few seconds.`
            }]} /> }

            { showCopyInProgress && <Flashbar items={[{
                type: 'info',
                loading: true,
                content: 
                permissionCreationMethod === 'new-role' ? 
                    "Creating role and importing file from initial location: don't navigate away from this page"
                    : 
                    "Importing file from initial location: don't navigate away from this page"
            }]} /> }

            { !showFlashbar && !showCopyInProgress && s3Resource.uri !== "" && <Alert>
                After extraction, your data is ingested and optimized for visualization purpose. You will be redirected to the
                project dashboard in the meantime.
            </Alert> }
        </SpaceBetween>
    )
})

export default CSVFromS3