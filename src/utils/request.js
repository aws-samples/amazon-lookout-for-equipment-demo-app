import { Amplify, API } from "aws-amplify"
import { retryWrapper } from "./index"

const target_list = {
	"LookoutEquipment": "AWSLookoutEquipmentFrontendService",
	"DynamoDB": "DynamoDB_20120810",
    "StepFunctions": "AWSStepFunctions"
}

Amplify.configure({
	Auth: {
		identityPoolId: `${import.meta.env.VITE_REGION}:${import.meta.env.VITE_IDENTITY_POOL_ID}`,
		region: `${import.meta.env.VITE_REGION}`,
		mandatorySignIn: true,
		userPoolId: `${import.meta.env.VITE_USER_POOL_ID}`,
		userPoolWebClientId: `${import.meta.env.VITE_USER_POOL_WEB_CLIENT_ID}`,
	},
	API: {
		endpoints: [
			{
				name: "LookoutEquipmentApi",
				endpoint: `https://lookoutequipment.${import.meta.env.VITE_REGION}.amazonaws.com/`,
				region: `${import.meta.env.VITE_REGION}`,
				service: "lookoutequipment",
			},
			{
				name: "DynamoDBApi",
				endpoint: `https://dynamodb.${import.meta.env.VITE_REGION}.amazonaws.com/`,
				region: `${import.meta.env.VITE_REGION}`,
				service: "dynamodb",
			},
            {
                name: "StepFunctionsApi",
                endpoint: `https://states.${import.meta.env.VITE_REGION}.amazonaws.com/`,
                region: `${import.meta.env.VITE_REGION}`,
                service: "states"
            }
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