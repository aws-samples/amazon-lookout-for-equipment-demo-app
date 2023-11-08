const mime = require("mime-types");
const unzip = require("unzipper");

const {
    COGNITO_USER_POOL_ID,
    COGNITO_USER_POOL_CLIENT_ID,
    COGNITO_IDENTITY_POOL_ID,
    FROM_BUCKET,
    FROM_PREFIX,
    CREATE_CLOUDFRONT_DISTRIBUTION,
    REGION,
    TO_BUCKET,
    VERSION,
    USER_FILES_BUCKET,
    SFN_MODEL_DEPLOYMENT_ARN,
    SFN_MODEL_RESULTS_EXTRACTION_ARN,
    SFN_DATASET_PREPARATION,
    SFN_TIMESTREAM_EXPORT,
    STACK_ID,
    ALLOW_USER_SIGN_UP,
    API_GATEWAY_ID
} = process.env;

const CONFIG_FILENAME = "app.config.js";
const ACL = CREATE_CLOUDFRONT_DISTRIBUTION == "true" ? "private" : "public-read";

module.exports = (s3) => {
    const deleteFile = (params) => s3.deleteObject(params).promise();
    const listFiles = (params) => s3.listObjectsV2(params).promise();
    const upload = (params) => s3.upload(params).promise();

    return {
        // ------------------------------------------------
        // Copy all the files from the source bucket to the 
        // target bucket to be served from the user account
        // ------------------------------------------------
        copyFiles: () => {
            unzip.Open.s3(s3, { Bucket: FROM_BUCKET, Key: FROM_PREFIX })
            .then((directory) =>
                directory.files.filter((x) => x.type !== "Directory")
            )
            .then((files) =>
                files.map((file, index) => {
                    if (file.path != CONFIG_FILENAME) {
                        console.log(`(File ${index}/${files.length}) ${file.path}`)
                        upload({
                            ACL,
                            Body: file.stream(),
                            Bucket: TO_BUCKET,
                            ContentType: mime.lookup(file.path) || "application/octet-stream",
                            Key: file.path,
                        })
                    }
                })
            )
            .then((ps) => Promise.all(ps))
        },

        // ------------------------------------------------------
        // Removes all the frontend files when deleting the stack
        // ------------------------------------------------------
        removeFiles: () => {
            listFiles({ Bucket: TO_BUCKET })
            .then((result) => {
                Promise.all(
                    result.Contents.map((file) => file.Key).map((file) => {
                        console.log('Deleting', file)
                        deleteFile({ Bucket: TO_BUCKET, Key: file })
                    })
                );
            })
        },

        // ----------------------------------------------------------------
        // Write the settings configuration to access the backend resources
        // ----------------------------------------------------------------
        writeSettings: () => {
            s3.putObject({
                ACL,
                Bucket: TO_BUCKET,
                Key: CONFIG_FILENAME,
                ContentType: "application/javascript",
                Body: `var version = "${VERSION}";
var region = "${REGION}";
var userPoolId = "${COGNITO_USER_POOL_ID}";
var userPoolWebClientId = "${COGNITO_USER_POOL_CLIENT_ID}";
var identityPoolId = "${COGNITO_IDENTITY_POOL_ID}";
var appS3Bucket = "${USER_FILES_BUCKET}";
var stackId = "${STACK_ID}";
var deployModelArn = "${SFN_MODEL_DEPLOYMENT_ARN}";
var modelResultsExtractionArn = "${SFN_MODEL_RESULTS_EXTRACTION_ARN}";
var datasetPreparationArn = "${SFN_DATASET_PREPARATION}";
var timestreamUploadArn = "${SFN_TIMESTREAM_EXPORT}";
var allowUserSignUp = "${ALLOW_USER_SIGN_UP}";
var apiGatewayId = "${API_GATEWAY_ID}";`
            }).promise();
        }
    };
};
