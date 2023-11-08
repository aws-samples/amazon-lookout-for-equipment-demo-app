import { Amplify, API } from "aws-amplify"
import { retryWrapper } from "./index"

const target_list = {
	"LookoutEquipment": "AWSLookoutEquipmentFrontendService",
	"DynamoDB": "DynamoDB_20120810",
    "StepFunctions": "AWSStepFunctions",
    "TimestreamWrite": "Timestream_20181101",
    "TimestreamQuery": "Timestream_20181101",
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
		],
	},
})

const request = (service, endpointName, data) =>
    retryWrapper(() => 
		API.post(service + "Api", "", {
			body: data || {},
			headers: {
				"Content-Type": "application/x-amz-json-1.0",
				"X-Amz-Target": `${target_list[service]}.${endpointName}`,
			},
		})
	)

export default request