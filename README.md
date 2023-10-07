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

<img src="public/application-workflow-diagram.png" alt="App workflow details" />

## Table of content

* [Installations instructions](INSTALL.md)
* [Updating the app](INSTALL.md#updatingTheApp)
* Uninstalling the app
* Usage: first connection
* How to manually create user
* Architecture overview

## Usage
Once the template is deployed, stay on the CloudFormation service page and navigate to the `Ouputs` tab:

<img src="assets/screenshots/install-outputs.png" />

Click on the `ApplicationUrl` link to open the authentication page of the Lookout for Equipment demo application:

<img src="assets/screenshots/login-page.png" />

While the CloudFormation template was deploying, you will receive an email with your one-time password to log into the app. Use it to log into the application. You will immediately be requested to change your password. After you change it, you will land on the `Welcome` page of the app:

<img src="assets/screenshots/welcome-page.png" />

Your application is empty, you are now ready to create your first project!

You can refer yourself to this [User Guide](USER_GUIDE.md) to learn how to make the most out of this application.

## How to manually create user

When deploying the template, you have the option to prevent user to sign up from the app. If you deploy this app behind a CloudFront distribution, anyone with the link can sign up and start creating resources in your AWS account. To prevent this, you can block the
user sign up feature. In this case, you will have to go and create user manually after the template is deployed.

To do this, once the template is deployed, stay on the CloudFormation service page and navigate to the `Ouputs` tab:

<img src="assets/screenshots/install-outputs.png" />

Click on the `UserPool` link to open the Cognito User Pool console on the configuration page of your user pool. From there, scroll to the `Users` section and click on the `Create user` button:

<img src="assets/screenshots/cognito-user-pool.png" />

On the user creation page, select the following options:
* Invitation message: `Send an email invitation`
* User name: this will be the login your end user will fill in to connect to the app
* Email address: needed to receive the temporary password
* Temporary password: you can let Cognito generate it for you

<img src="assets/screenshots/cognito-create-user.png" />

The user will receive a welcome message and will be able to log into your application with these. The user will be prompted to change the account password immediately.

## Architecture overview
This template will deploy the following components in your AWS account:

<img src="assets/architecture-diagram-without-legend.png" alt="Architecture diagram" />

0. Deploy this AWS Solution into your AWS account. The React frontend is stored in S3 and distributed by CloudFront
1. Open the App and use Amazon Cognito to authenticate.
2. To create a new project, end user uploads a CSV file that will be used to create an Amazon Lookout for Equipment project. Data will also be prepared for visualization purpose in the app. The prepared data will be stored in a DynamoDB table.
3. Once a project is created, user can visualize the project attributes and a summary of the ingested dataset
4. User can also dive deeper in the sensor data, visualize sensor grade results, timeseries and value distributions
5. The labeling page allows users to create labels and group them in label groups.
6. User can train a model. The application will monitor the training process. Once training is finished, the results will be postprocessed: the anomalies and the sensor contributions will be stored in DynamoDB tables.
7. After training, user can visualize model results: anomalies, sensor contribution, sensor behavior deep dive between training and evaluation range (when provided).
8. User can deploy a model. The same page also allows the user to trigger synthetic data generation to populate the input inference bucket based on extracts from the historical data.
9. After a model is deployed, the app will monitor new inference results and store them in DynamoDB tables. Users has access to a deep dive dashboard to understand the anomalies detected in the process or piece of equipment monitored.

### Costs consideration

The main cost driver of this application is the number of Lookout for Equipment models deployed. Each running inference scheduler will cost you $0.25/hr (approx. $180 / month). Make sure you only leave the schedulers you need running and stop the others when you don't need them anymore.

This application leverages Amazon DynamoDB to store precalculated datasets and accelerate visualization. A typical project leveraging a dataset with 2 years of data and 30 sensors will store around 60 MB of data. From a storage perspective, DynamoDB has a free tier of 25 GB per month which should be enough to store several hundreds projects free of charge. The read and write requests necessary to monitor an asset on a daily basis will stay well under $1 / month / project.

All the other resources leverage by the application in the backend (Step Functions, S3, Lambda, CloudFront, EventBridge, and Cognito) will have a negligeable costs (less than $0.50 / month / project).

### Repository structure
This folder is structured as followed:

```
. amazon-lookout-for-equipment-demo-app/
|
├── index.html                          <-- Entry point of the app
|
├── README.md                           <-- This instruction file
|
├── assets/
|   ├── cloud-formation/                <-- The CloudFormation template YAML file definition
|   ├── lambda-functions/               <-- Lambda functions source code (mostly written in Python)
|   ├── layers/                         <-- Lambda layers
|   ├── screenshots/                    <-- Pictures used in this README.md file
|   └── state-machines/                 <-- Step functions JSON definitions
|
├── public/
|   ├── app.config.js                   <-- File generated at deployment time to configure your app
|   └── *.png, *.gif                    <-- All pictures used by the application
|
└── src/                                <-- Source code of the frontend (mostly written in Javascript)
```

## Questions

Please contact the [**Lookout for Equipment team**](mailto:aws-custfeedback-l4edemoapp@amazon.fr?subject=Lookout%20for%20Equipment%20Demo%20App%20Feedback) or raise an issue against this repository.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.