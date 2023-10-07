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