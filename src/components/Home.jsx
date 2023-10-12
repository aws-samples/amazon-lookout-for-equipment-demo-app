// Imports:
import { useContext } from 'react'
import { Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'

// App components:
import CreateProject    from './CreateProject'
import Labeling         from './Labeling'
import ModelTraining    from './ModelTraining'
import ModelDeployment  from './ModelDeployment'
import OfflineResults   from './OfflineResults'
import OnlineMonitoring from './OnlineMonitoring'
import ProjectDashboard from './ProjectDashboard'
import SensorOverview   from './SensorOverview'
import TopMenuBar       from './TopMenuBar'
import Welcome          from './Welcome'
import NavigationBar    from './NavigationBar'

// Cloudscape components:
import AppLayout from "@cloudscape-design/components/app-layout"

// Contexts:
import { ApiGatewayProvider } from './contexts/ApiGatewayContext'
import HelpPanelContext from './contexts/HelpPanelContext'

const queryClient = new QueryClient()

function Home({ user, signOut }) {
    const { helpPanelOpen, setHelpPanelOpen, panelContent } = useContext(HelpPanelContext)

    return (
        <QueryClientProvider client={queryClient}>
            <ApiGatewayProvider user={user}>
                <TopMenuBar user={user} signOut={signOut} />
                <Routes>
                    <Route path="/" 
                           element={
                               <AppLayout 
                                   toolsHide={true} 
                                   navigation={<NavigationBar />} 
                                   content={<Welcome />} 
                               />
                           } 
                    />
                    <Route 
                        path="/create-project" 
                        element={
                            <AppLayout 
                                contentType="default"
                                navigation={<NavigationBar />} 
                                content={<CreateProject />}
                                toolsOpen={helpPanelOpen.status}
                                tools={panelContent.current}
                                onToolsChange={(e) => {
                                    if (!helpPanelOpen.page) {
                                        setHelpPanelOpen({
                                            status: true,
                                            page: 'createProject',
                                            section: 'dataset'
                                        })
                                    }
                                    else {
                                        setHelpPanelOpen({
                                            status: e.detail.open,
                                            page: helpPanelOpen.page,
                                            section: helpPanelOpen.section
                                        })
                                    }
                                }}
                            />
                        } 
                    />
                    <Route 
                        path="/project-dashboard/projectName/:projectName"
                        element={
                            <AppLayout
                                contentType="default"
                                navigation={<NavigationBar />} 
                                content={ <ProjectDashboard /> }
                                toolsOpen={helpPanelOpen.status}
                                tools={panelContent.current}
                                onToolsChange={(e) => {
                                    if (!helpPanelOpen.page) {
                                        setHelpPanelOpen({
                                            status: true,
                                            page: 'projectDashboard',
                                            section: 'summary'
                                        })
                                    }
                                    else {
                                        setHelpPanelOpen({
                                            status: e.detail.open,
                                            page: helpPanelOpen.page,
                                            section: helpPanelOpen.section
                                        })
                                    }
                                }}
                            />
                        } 
                    />
                    <Route 
                        path="/sensor-overview/projectName/:projectName"
                        element={
                            <AppLayout
                                contentType="default"
                                navigation={<NavigationBar />}
                                content={ <SensorOverview /> }
                                maxContentWidth={Number.MAX_VALUE}
                                toolsOpen={helpPanelOpen.status}
                                onToolsChange={(e) => {
                                    if (!helpPanelOpen.page) {
                                        setHelpPanelOpen({
                                            status: true,
                                            page: 'sensorOverview',
                                            section: 'general'
                                        })
                                    }
                                    else {
                                        setHelpPanelOpen({
                                            status: e.detail.open,
                                            page: helpPanelOpen.page,
                                            section: helpPanelOpen.section
                                        })
                                    }
                                }}
                                tools={panelContent.current}
                            />
                        } 
                    />
                    <Route 
                        path="/labeling/projectName/:projectName" 
                        element={
                            <AppLayout
                                contentType="default"
                                navigation={<NavigationBar />}
                                content={<Labeling />}
                                toolsOpen={helpPanelOpen.status}
                                onToolsChange={(e) => {
                                    if (!helpPanelOpen.page) {
                                        setHelpPanelOpen({
                                            status: true,
                                            page: 'labelling',
                                            section: 'general'
                                        })
                                    }
                                    else {
                                        setHelpPanelOpen({
                                            status: e.detail.open,
                                            page: helpPanelOpen.page,
                                            section: helpPanelOpen.section
                                        })
                                    }
                                }}
                                tools={panelContent.current}
                            />
                        }
                    />
                    <Route 
                        path="/model-training/projectName/:projectName" 
                        element={
                            <AppLayout
                                contentType="default"
                                navigation={<NavigationBar />}
                                toolsOpen={helpPanelOpen.status}
                                maxContentWidth={Number.MAX_VALUE}
                                onToolsChange={(e) => {
                                    if (!helpPanelOpen.page) {
                                        setHelpPanelOpen({
                                            status: true,
                                            page: 'modelTraining',
                                            section: 'general'
                                        })
                                    }
                                    else {
                                        setHelpPanelOpen({
                                            status: e.detail.open,
                                            page: helpPanelOpen.page,
                                            section: helpPanelOpen.section
                                        })
                                    }
                                }}
                                tools={panelContent.current}
                                content={<ModelTraining />}
                            />
                        }
                    />
                    <Route 
                        path="/offline-results/modelName/:modelName/projectName/:projectName"
                        element={
                            <AppLayout
                                contentType="default"
                                navigation={<NavigationBar />}
                                toolsOpen={helpPanelOpen.status}
                                onToolsChange={(e) => {
                                    if (!helpPanelOpen.page) {
                                        setHelpPanelOpen({
                                            status: true,
                                            page: 'offlineResults',
                                            section: 'modelOverview'
                                        })
                                    }
                                    else {
                                        setHelpPanelOpen({
                                            status: e.detail.open,
                                            page: helpPanelOpen.page,
                                            section: helpPanelOpen.section
                                        })
                                    }
                                }}
                                tools={panelContent.current}
                                content={<OfflineResults />}
                            />
                        }
                    />
                    <Route 
                        path="/online-monitoring/modelName/:modelName/projectName/:projectName"
                        element={
                            <AppLayout
                                contentType="default"
                                navigation={<NavigationBar />}
                                toolsOpen={helpPanelOpen.status}
                                onToolsChange={(e) => {
                                    if (!helpPanelOpen.page) {
                                        setHelpPanelOpen({
                                            status: true,
                                            page: 'onlineResults',
                                            section: 'general'
                                        })
                                    }
                                    else {
                                        setHelpPanelOpen({
                                            status: e.detail.open,
                                            page: helpPanelOpen.page,
                                            section: helpPanelOpen.section
                                        })
                                    }
                                }}
                                tools={panelContent.current}
                                content={<OnlineMonitoring />}
                            />
                        }
                    />
                    <Route 
                        path="/online-monitoring/modelName/:modelName/projectName/:projectName/initialRange/:initialRange"
                        element={
                            <AppLayout
                                contentType="default"
                                navigation={<NavigationBar />}
                                toolsOpen={helpPanelOpen.status}
                                onToolsChange={(e) => {
                                    if (!helpPanelOpen.page) {
                                        setHelpPanelOpen({
                                            status: true,
                                            page: 'onlineResults',
                                            section: 'general'
                                        })
                                    }
                                    else {
                                        setHelpPanelOpen({
                                            status: e.detail.open,
                                            page: helpPanelOpen.page,
                                            section: helpPanelOpen.section
                                        })
                                    }
                                }}
                                tools={panelContent.current}
                                content={<OnlineMonitoring />}
                            />
                        }
                    />
                    <Route 
                        path="/model-deployment/projectName/:projectName"
                        element={
                            <AppLayout
                                contentType="default"
                                navigation={<NavigationBar />}
                                toolsOpen={helpPanelOpen.status}
                                onToolsChange={(e) => {
                                    if (!helpPanelOpen.page) {
                                        setHelpPanelOpen({
                                            status: true,
                                            page: 'modelDeployment',
                                            section: 'general'
                                        })
                                    }
                                    else {
                                        setHelpPanelOpen({
                                            status: e.detail.open,
                                            page: helpPanelOpen.page,
                                            section: helpPanelOpen.section
                                        })
                                    }
                                }}
                                tools={panelContent.current}
                                content={<ModelDeployment />}
                            />
                        }
                    />
                </Routes>
            </ApiGatewayProvider>
        </QueryClientProvider>
    )
}

export default Home