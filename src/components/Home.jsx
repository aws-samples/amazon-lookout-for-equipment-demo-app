// Imports:
import { Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'

// App components:
import CreateProject        from './CreateProject'
import Labeling             from './Labeling'
import ModelTraining        from './ModelTraining'
import ModelDeployment      from './ModelDeployment'
import OfflineResults       from './OfflineResults'
import OnlineMonitoring     from './OnlineMonitoring'
import ProjectDashboard     from './ProjectDashboard'
import SensorOverview       from './SensorOverview'
import TopMenuBar           from './TopMenuBar'
import Welcome              from './Welcome'

// Contexts:
import { ApiGatewayProvider } from './contexts/ApiGatewayContext'
import { HelpPanelProvider } from './contexts/HelpPanelContext'

////////////////////////////
// ADD A BREADCRUMB
// Give a name to the App (like QnABot)
////////////////////////////

const queryClient = new QueryClient()

function Home({ user, signOut }) {
    return (
        <QueryClientProvider client={queryClient}>
            <ApiGatewayProvider user={user}>
                <HelpPanelProvider>
                    <TopMenuBar user={user} signOut={signOut} />
                    <Routes>
                        <Route path="/" element={<Welcome />} />
                        <Route path="/create-project" element={<CreateProject />} />
                        <Route 
                            path="/project-dashboard/projectName/:projectName"
                            element={<ProjectDashboard />} 
                        />
                        <Route 
                            path="/sensor-overview/projectName/:projectName"
                            element={<SensorOverview />} 
                        />
                        <Route 
                            path="/labeling/projectName/:projectName" 
                            element={<Labeling />} 
                        />
                        <Route 
                            path="/model-training/projectName/:projectName" 
                            element={<ModelTraining />} 
                        />
                        <Route 
                            path="/offline-results/modelName/:modelName/projectName/:projectName"
                            element={<OfflineResults />} 
                        />
                        <Route 
                            path="/online-monitoring/modelName/:modelName/projectName/:projectName"
                            element={<OnlineMonitoring />} 
                        />
                        <Route 
                            path="/online-monitoring/modelName/:modelName/projectName/:projectName/initialRange/:initialRange"
                            element={<OnlineMonitoring />}
                        />
                        <Route 
                            path="/model-deployment/projectName/:projectName" 
                            element={<ModelDeployment />} 
                        />
                    </Routes>
                </HelpPanelProvider>
            </ApiGatewayProvider>
        </QueryClientProvider>
    )
}

export default Home