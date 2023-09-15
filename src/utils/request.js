import { Amplify, API } from "aws-amplify"
import { retryWrapper } from "./index"
import appConfig from '../demoAppConfig.json'

const target_list = {
	"LookoutEquipment": "AWSLookoutEquipmentFrontendService",
	"DynamoDB": "DynamoDB_20120810",
    "StepFunctions": "AWSStepFunctions"
}

Amplify.configure({
	Auth: {
		identityPoolId: `${appConfig.region}:${appConfig.identityPoolId}`,
		region: `${appConfig.region}`,
		mandatorySignIn: true,
		userPoolId: `${appConfig.userPoolId}`,
		userPoolWebClientId: `${appConfig.userPoolWebClientId}`,
	},
	API: {
		endpoints: [
			{
				name: "LookoutEquipmentApi",
				endpoint: `https://lookoutequipment.${appConfig.region}.amazonaws.com/`,
				region: `${appConfig.region}`,
				service: "lookoutequipment",
			},
			{
				name: "DynamoDBApi",
				endpoint: `https://dynamodb.${appConfig.region}.amazonaws.com/`,
				region: `${appConfig.region}`,
				service: "dynamodb",
			},
            {
                name: "StepFunctionsApi",
                endpoint: `https://states.${appConfig.region}.amazonaws.com/`,
                region: `${appConfig.region}`,
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