import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BrowserRouter as Router } from "react-router-dom"

import "@aws-amplify/ui-react/styles.css";
import "@cloudscape-design/global-styles/index.css";
import "./styles/styles.css"
import { I18nProvider } from '@cloudscape-design/components/i18n'
import messages from '@cloudscape-design/components/i18n/messages/all.all';

import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-react'

const awsconfig = {
    "aws_project_region": `${window.region}`,
    "aws_cognito_identity_pool_id": `${window.identityPoolId}`,
    "aws_cognito_region": `${window.region}`,
    "aws_user_pools_id": `${window.userPoolId}`,
    "aws_user_pools_web_client_id": `${window.userPoolWebClientId}`,
    "oauth": {},
    "aws_cognito_username_attributes": [],
    "aws_cognito_social_providers": [],
    "aws_cognito_signup_attributes": ["EMAIL"],
    "aws_cognito_mfa_configuration": "OFF",
    "aws_cognito_mfa_types": ["SMS"],
    "aws_cognito_password_protection_settings": {
        "passwordPolicyMinLength": 8,
        "passwordPolicyCharacters": []
    },
    "aws_cognito_verification_mechanisms": ["EMAIL"],
    "aws_user_files_s3_bucket": `${window.appS3Bucket}`,
    "aws_user_files_s3_bucket_region": `${window.region}`
};

Amplify.configure(awsconfig)

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Authenticator.Provider>
            <I18nProvider messages={[messages]}>
                <Router>
                    <App />
                </Router>
            </I18nProvider>
        </Authenticator.Provider>
    </React.StrictMode>
)