// Imports:
import { useContext, useEffect } from 'react'

// Cloudscape components:
import Box          from "@cloudscape-design/components/box"
import Icon         from "@cloudscape-design/components/icon"
import Spinner      from "@cloudscape-design/components/spinner"

// Contexts:
import ApiGatewayContext from "../contexts/ApiGatewayContext"

function Refresh({ refreshTimer, refreshInterval, refreshStartTime, progressBar }) {
    const { navbarCounter, setNavbarCounter } = useContext(ApiGatewayContext)

    // This effect will trigger a refresh of the page where this component added:
    useEffect(() => {
        const interval = setInterval(() => {
            refreshTimer(Date.now()) 
            if (progressBar) {
                progressBar.current = ('.'.repeat(parseInt((Date.now() - refreshStartTime)/(refreshInterval * 1000)) + 1))
            }

            // This forces a refresh of the side bar navigation
            // so we can see the new project name popping up:
            setNavbarCounter(navbarCounter + 1)
        }, refreshInterval * 1000)
        return () => { clearInterval(interval) }
    }, [])

    if (progressBar) {
        return (
            <Box>
                {Array.from(
                    { length: progressBar.current.length }, 
                    (_, i) => <Icon name="drag-indicator" size="normal" variant="link" />
                )}
                <Spinner />
            </Box>
        )
    }
    else {
        return (<Spinner />)
    }
}

export default Refresh