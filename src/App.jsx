import { useAuthenticator, Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import cloudscapeTheme from "./styles/cloudscapeTheme";

import Home from './components/Home'
import TopMenuBar from './components/TopMenuBar'

// Cloudscape components:
import Alert             from "@cloudscape-design/components/alert"
import AppLayout         from "@cloudscape-design/components/app-layout"
import Container         from "@cloudscape-design/components/container"
import ContentLayout     from "@cloudscape-design/components/content-layout"
import Header            from "@cloudscape-design/components/header"
import SpaceBetween      from "@cloudscape-design/components/space-between"
import TextContent       from "@cloudscape-design/components/text-content"

function App() {
  const { authStatus, user, signOut } = useAuthenticator(context => [context.authStatus])

  return (
    <div>
      {authStatus === 'configuring' && 'Loading...'}
      {authStatus !== 'authenticated' && authStatus !== 'configuring' ? 
        <ThemeProvider theme={cloudscapeTheme}>
            <TopMenuBar />

            <AppLayout
                navigationHide={true}
                toolsHide={true}
                content={
                    <ContentLayout header={<Header variant="h1">Welcome!</Header>}>
                        <SpaceBetween size="xl">
                            <Container>
                                <TextContent>
                                    <p>
                                        This application will help you assess quickly if your industrial data contains any
                                        historical anomaly of interest. After you upload a dataset containing sensor measurements
                                        from your industrial equipment or manufacturing process, you will be guided to train
                                        an anomaly detection model. You will then be able to visualize your model results and deploy 
                                        it, making it ready to receive your shop floor live data. This application also includes an
                                        operational dashboard to visualize your live results.
                                    </p>
                                    
                                    <h5>Use the following form to sign into the application.</h5>
                                </TextContent>
                            </Container>

                            {window.allowUserSignUp === "false" && <Alert>
                                Your administrator does not allow new users to sign up using this form. Contact them to
                                create a new account.
                            </Alert> }

                            <Authenticator 
                                initialState="signIn"
                                hideSignUp={window.allowUserSignUp === "false"}
                            />
                        </SpaceBetween>
                    </ContentLayout>
                }
            />
        </ThemeProvider>
        : <Home user={user} signOut={signOut} />
      }
      
    </div>
  )
}

export default App