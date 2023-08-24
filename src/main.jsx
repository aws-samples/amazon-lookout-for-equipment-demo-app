import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BrowserRouter as Router } from "react-router-dom"

import "@aws-amplify/ui-react/styles.css";
import "@cloudscape-design/global-styles/index.css";
import "./styles/styles.css"

import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-react'
import awsconfig from './aws-exports.js'

Amplify.configure(awsconfig)

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Authenticator.Provider>
            <Router>
                <App />
            </Router>
        </Authenticator.Provider>
    </React.StrictMode>
)