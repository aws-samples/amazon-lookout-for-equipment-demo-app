// Imports:
import { useContext, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// CloudScape components:
import SideNavigation from '@cloudscape-design/components/side-navigation'
import Spinner from '@cloudscape-design/components/spinner'

// Contexts:
import ApiGatewayContext from './contexts/ApiGatewayContext'

// Utils:
import { buildHierarchy } from './navigationBar/navbarUtils'

// ==========================
// Component main entry point
// ==========================
function NavigationBar({ activeHref }) {
    const { gateway, uid, navbarCounter, setNavbarCounter } = useContext(ApiGatewayContext)
    const [navItems, setNavItems] = useState(undefined)
    const navigate = useNavigate()
    const { projectName } = useParams()
    const [time, setTime] = useState(Date.now())

    // This effects will triggers a refresh of the menu bar every 60 seconds:
    useEffect(() => {
      const interval = setInterval(() => setTime(Date.now()), 60 * 1000)
      return () => { clearInterval(interval) }
    }, [])

    // Builds the hierarchy:
    useEffect(() => {
        buildHierarchy(gateway, projectName, uid)
        .then((x) => setNavItems(x))
    }, [projectName, time, uid, navbarCounter])

    // Renders the side navigation bar:
    const NavBar = () => {
        if (navItems && uid) {
            return (
                <>
                    <SideNavigation 
                        items={navItems} 
                        header={{ text: 'Home', href: '/' }} 
                        activeHref={activeHref}
                        onFollow={event => {
                            event.preventDefault()
                            navigate(event['detail']['href'])
                        }}
                    />
                </>
            )
        }
        else {
            return <Spinner />
        }
    }

    return (<NavBar />)
}

export default NavigationBar