import { useAuthenticator, Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import cloudscapeTheme from "./styles/cloudscapeTheme";

import Home from './components/Home'

function App() {
  const { authStatus, user, signOut } = useAuthenticator(context => [context.authStatus])

  return (
    <div>
      {authStatus === 'configuring' && 'Loading...'}
      {authStatus !== 'authenticated' ? 
        <ThemeProvider theme={cloudscapeTheme}>
            <Authenticator />
        </ThemeProvider>
        : <Home user={user} signOut={signOut} />
      }
      
    </div>
  )
}

export default App