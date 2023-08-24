import { Amplify, API } from "aws-amplify"
import { retryWrapper } from "./index"

const region = "eu-west-1"
const target_list = {
	"LookoutEquipment": "AWSLookoutEquipmentFrontendService",
	"DynamoDB": "DynamoDB_20120810",
    "StepFunctions": "AWSStepFunctions"
}

Amplify.configure({
	Auth: {
		identityPoolId: "eu-west-1:580d8750-fca6-49d2-ada6-2afdc9075bd7",
		region: region,
		mandatorySignIn: true,
		userPoolId: "eu-west-1_s93PCdhWT",
		userPoolWebClientId: "3dblqgvrm6midi34iq6oabjv9l",
	},
	API: {
		endpoints: [
			{
				name: "LookoutEquipmentApi",
				endpoint: `https://lookoutequipment.${region}.amazonaws.com/`,
				region: region,
				service: "lookoutequipment",
			},
			{
				name: "DynamoDBApi",
				endpoint: `https://dynamodb.${region}.amazonaws.com/`,
				region: region,
				service: "dynamodb",
			},
            {
                name: "StepFunctionsApi",
                endpoint: `https://states.${region}.amazonaws.com/`,
                region: region,
                service: "states"
            }
			// {
			// 	name: "L4EDemoAppBackendApi",
			// 	endpoint: `https://kfzzjcmj0a.execute-api.${region}.amazonaws.com/dev/`,
			// 	region: region
			// },
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