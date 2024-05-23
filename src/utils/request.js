import { Amplify, API } from "aws-amplify"
import { retryWrapper } from "./index"

const target_list = {
	"LookoutEquipment": "AWSLookoutEquipmentFrontendService",
	"DynamoDB": "DynamoDB_20120810",
    "StepFunctions": "AWSStepFunctions",
    "TimestreamWrite": "Timestream_20181101",
    "TimestreamQuery": "Timestream_20181101",
    "Glue": "AWSGlue",
    "Athena": "AmazonAthena"
}

const timestreamWritecell = {
    'us-east-1': 'ingest-cell2',
    'eu-west-1': 'ingest-cell1',
    'ap-northeast-2': 'ingest'
}

const timestreamQueryCell = {
    'us-east-1': 'query-cell2',
    'eu-west-1': 'query-cell1',
    'ap-northeast-2': 'query'
}

const contentType = {
    "LookoutEquipment": "application/x-amz-json-1.0",
	"DynamoDB": "application/x-amz-json-1.0",
    "StepFunctions": "application/x-amz-json-1.0",
    "TimestreamWrite": "application/x-amz-json-1.0",
    "TimestreamQuery": "application/x-amz-json-1.0",
    "Glue": "application/x-amz-json-1.1",
    "Athena": "application/x-amz-json-1.1"
}

Amplify.configure({
	Auth: {
		identityPoolId: `${window.identityPoolId}`,
		region: `${window.region}`,
		mandatorySignIn: true,
		userPoolId: `${window.userPoolId}`,
		userPoolWebClientId: `${window.userPoolWebClientId}`,
	},
    Storage: {
        AWSS3: {
            bucket: `${window.appS3Bucket}`,
            region: `${window.region}`
        }
    },
	API: {
		endpoints: [
			{
				name: "LookoutEquipmentApi",
				endpoint: `https://lookoutequipment.${window.region}.amazonaws.com/`,
				region: `${window.region}`,
				service: "lookoutequipment",
			},
			{
				name: "DynamoDBApi",
				endpoint: `https://dynamodb.${window.region}.amazonaws.com/`,
				region: `${window.region}`,
				service: "dynamodb",
			},
            {
                name: "StepFunctionsApi",
                endpoint: `https://states.${window.region}.amazonaws.com/`,
                region: `${window.region}`,
                service: "states"
            },
            {
                name: "TimestreamWriteApi",
                endpoint: `https://${timestreamWritecell[window.region]}.timestream.${window.region}.amazonaws.com/`,
                region: `${window.region}`,
                service: "timestream"
            },
            {
                name: "TimestreamQueryApi",
                endpoint: `https://${timestreamQueryCell[window.region]}.timestream.${window.region}.amazonaws.com/`,
                region: `${window.region}`,
                service: "timestream"
            },
            {
                name: "GlueApi",
                endpoint: `https://glue.${window.region}.amazonaws.com/`,
                region: `${window.region}`,
                service: "glue"
            },
            {
                name: "AthenaApi",
                endpoint: `https://athena.${window.region}.amazonaws.com/`,
                region: `${window.region}`,
                service: "athena"
            }
		],
	},
})

const request = (service, endpointName, data) =>
    retryWrapper(() => 
		API.post(service + "Api", "", {
			body: data || {},
			headers: {
				"Content-Type": contentType[service],
				"X-Amz-Target": `${target_list[service]}.${endpointName}`,
			},
		})
	)

export default request