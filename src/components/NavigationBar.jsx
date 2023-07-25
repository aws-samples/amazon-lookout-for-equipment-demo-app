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
    const { gateway } = useContext(ApiGatewayContext)
    const [navItems, setNavItems] = useState([])
    const navigate = useNavigate()
    const { projectName } = useParams()

    // Builds the hierarchy:
    useEffect(() => {
        buildHierarchy(gateway, projectName)
        .then((x) => setNavItems(x))
    }, [])

    // Renders the side navigation bar:
    const NavBar = () => {
        if (navItems) {
            return (
                <SideNavigation 
                    items={navItems} 
                    header={{ text: 'Home', href: '/' }} 
                    activeHref={activeHref}
                    onFollow={event => {
                        event.preventDefault()
                        navigate(event['detail']['href'])
                    }}
            />
            )
        }
        else {
            return <Spinner />
        }
    }

    return (<NavBar />)
}

export default NavigationBar