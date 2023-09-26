# Amazon Lookout for Equipment Demo Application
Amazon Lookout for Equipment uses the data from your sensors to detect abnormal equipment behavior, so you
can take action before machine failures occur and avoid unplanned downtime.

This application will help you assess quickly if your industrial data contains any historical anomaly of 
interest. After you upload a dataset containing sensor measurements from your industrial equipment or 
manufacturing process, you will be guided to train an anomaly detection model. You will then be able to 
visualize your model results and deploy it, making it ready to receive your shop floor live data. This 
application also includes an operational dashboard to visualize your live results.

The following diagram illustrate the workflow you will follow to train and deploy your first model with 
this application (in the red frame below). The key steps are highlighted in the green boxes while the blue 
ones are optional:

<img src="/public/application-workflow-diagram.png" alt="App workflow details>

## Installation instructions
### AWS Account creation
[**Create an AWS account**](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html) if
you do not already have one: then you can setup your environment automatically by deploying the following 
CloudFormation template.

### Deploy the application
In another browser window, login to your AWS account. Once you have done that, open one of the link below 
(depending on the region closest to you) in a new tab to start the process of deploying the items you need 
via CloudFormation.

*Note: This material is designed to work in the regions where the service is available. Using other regions will cause issues.*

| Region |     | CloudFormation Stack |
| ---    | --- | --- |
| US East (N. Virginia) | **us-east-1** | [![Launch stack](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=L4EDemoApp&templateURL=https://lookout-equipment-content-us-east-1.s3.amazonaws.com/l4e-demo-app/v1.0.0/cloud-formation-templates/l4e-demo-app-setup.yaml) |
| Europe (Ireland) | **eu-west-1** | [![Launch stack](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://eu-west-1.console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/new?stackName=L4EDemoApp&templateURL=https://lookout-equipment-content-eu-west-1.s3.eu-west-1.amazonaws.com/l4e-demo-app/v1.0.0/cloud-formation-templates/l4e-demo-app-setup.yaml) |
| Asia Pacific (Seoul) | **ap-northeast-2** | [![Launch stack](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://ap-northeast-2.console.aws.amazon.com/cloudformation/home?region=ap-northeast-2#/stacks/new?stackName=L4EDemoApp&templateURL=https://lookout-equipment-content-ap-northeast-2.s3.ap-northeast-2.amazonaws.com/l4e-demo-app/v1.0.0/cloud-formation-templates/l4e-demo-app-setup.yaml) |

After you clicked on the `Launch stack` button above, you will be brought to the `Create stack` screen. Start by clicking `Next` at the bottom:

To be finished...

### Uninstalling the demo app

To do

## Usage
Once the template is deployed, stay on the CloudFormation service page and navigate to the ouput tab.

To do

## Architecture overview
This template will deploy the following components in your AWS account:

To do

### Costs consideration

To do

### Repository structure
This folder is structured as followed:

```
. cloudwatch-dashboard/
|
├── README.md                          <-- This instruction file
|
├── assets/                            <-- Pictures used throughout the README file
|
├── layers/                            <-- Lambda layers
|   |
|   ├── lookout-equipment/             <-- Utility layers used by the Lambda functions
|   |
|   └── create-layer.sh                <-- Script to generate a layer from a public
|                                          package such as `pandas` or `matplotlib`
|
├── lambdas/                           <-- Lambda functions source code
|
└── synthetics/                        <-- Synthetics canary code to take dashboard snapshots
```

## Questions

Please contact the [**Lookout for Equipment team**](mailto:aws-custfeedback-l4edemoapp@amazon.fr?subject=Lookout%20for%20Equipment%20Demo%20App%20Feedback) or raise an issue on this repository.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.