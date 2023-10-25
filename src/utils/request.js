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



// {
//     'url_path': '/', 
//     'query_string': '', 
//     'method': 'POST', 
//     'headers': {
//         'X-Amz-Target': 'AWSLookoutEquipmentFrontendService.ListDatasets', 
//         'Content-Type': 'application/x-amz-json-1.0', 
//         'User-Agent': 'aws-cli/2.13.26 Python/3.11.6 Linux/4.14.255-322-265.538.amzn2.x86_64 exec-env/CloudShell exe/x86_64.amzn.2 prompt/off command/lookoutequipment.list-datasets'
//     }, 
//     'body': b'{}', 
//     'url': 'https://lookoutequipment.us-east-1.amazonaws.com/', 
//     'context': {
//         'client_region': 'us-east-1', 
//         'client_config': <botocore.config.Config object at 0x7fe629c240d0>, 
//         'has_streaming_input': False, 
//         'auth_type': None
//     }
// }

// method=POST, 
// url=https://ingest-cell2.timestream.us-east-1.amazonaws.com, 
// headers={
//     'X-Amz-Target': b'Timestream_20181101.ListTables', 
//     'Content-Type': b'application/x-amz-json-1.0', 
//     'User-Agent': b'aws-cli/2.13.26 Python/3.11.6 Linux/4.14.255-322-265.538.amzn2.x86_64 exec-env/CloudShell exe/x86_64.amzn.2 prompt/off command/timestream-write.list-tables', 
//     'X-Amz-Date': b'20231021T062337Z', 
//     'X-Amz-Security-Token': b'IQoJb3JpZ2luX2VjEM///////////wEaCXVzLWVhc3QtMSJIMEYCIQDd5CO79m4OqAfeykk6x8RAsTxVoNUdT0bh6Nvb7FN48wIhAInMUJzqgtvbEch8CNmhtdWKEketW1BydeY2ptdmiCYDKvwCCOf//////////wEQARoMOTA1NjM3MDQ0Nzc0IgxVksQuAAJsT6Umxgcq0AKYnMhoOiAWbUCEr3zsUaA04RWq1dt1mXLHJY9avASKp/sSuWQ8q8t4HurhsORVhuPo/ovGwaD2m3BVXRmLcajI/Kl3DvwQxNJ9Y5TKtefT//hECB6CeFkgukeplA6yB994PNOGOUwRIA2++X6bUl0Mxcb0Buj4DkzNoqilj4kd4WgTwrCnghHB/fcOE/pDFsz7jOlucBUt020gWVRz1UpAf8ABMVvY9alpEfxDMGrIzhLGzdgfD2q4QMnoygwkOJDrw8lNb3jyYxI2MsscGQ2F1rOXgTjNj3X3xvbD5zoQJhPMOoiWglvMgTQ0csyOa3YToCyGKq7Bv7OX7qnH09WUKBeOcDFWSCCfWHZptTuDKCX6GPld5tf/RhmKiy1FS24zEtMSMjxnz4qJ5hlHGqwdhTUSqGTcMawY7yZ5EJjM9dRjKY+lsze3GO+12QQ0s4EwocfNqQY6hgLNh+XlujMkfkETw7itqz6TYG8cRievmWgjnf5APxGye1LLCJLsjAVpN3em5FI61aAAQ2B9qvPc9lZ0ETa8JsPsaHrqx0Hv1FNA7fycjavimlWDIkfkWJsImq9RVaGCnMAmptuxZ0QYrt6WwINcVMnmvmiEUK7LvwY4yQ3OdI1aP7jZH+k/6Cc9zWg42C7YPlrKxYolx9MW9Bh6+V01X1i8MpBEK8G1GvPaGk5O8s3gUNsM7EnpwDRzqJ+D4eK1HIm6EVWBBzx8VQxCN7DH9LSJxCWh5L0983bGyvJ2y9XpEm4VWVwermn3PANCCtoIJxHHIHiJhMKua//JOq9sTzpnXnUSfCEl', 'Authorization': b'AWS4-HMAC-SHA256 Credential=ASIA5FXBMUITN4IADC7Z/20231021/us-east-1/timestream/aws4_request, SignedHeaders=content-type;host;x-amz-date;x-amz-security-token;x-amz-target, Signature=9aa76f030d2456e85776046fb41a6f9c8a5c7450e50b29d36e4b12a566f0df1b', 
//     'Content-Length': '2'
// }
