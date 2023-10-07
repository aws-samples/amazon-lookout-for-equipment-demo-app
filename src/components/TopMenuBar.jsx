// Imports:
import { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom"

// CloudScape components:
import TopNavigation from "@cloudscape-design/components/top-navigation"

// App component:
import Settings from './topMenuBar/Settings'
import ReleaseInfo from './topMenuBar/ReleaseInfo'
import SignOutConfirmation from './topMenuBar/SignOutConfirmation'

// Utils:
import { isLatestVersion } from '../utils/utils'

// =====================================================================
// Component main entry point. This component manages the top menu bar 
// appearing on all screens. Beyond the title, it includes the ability 
// to sign out and provides features linked to the current user profile:
// =====================================================================
function TopMenuBar({ user, signOut }) {
    // const { uid } = useContext(ApiGatewayContext)
    const [ showSettingsModal, setShowSettingsModal ]       = useState(false)
    const [ showReleaseInfoModal, setShowReleaseInfoModal ] = useState(false)
    const [ showSignOutModal, setShowSignOutModal ]      = useState(false)
    const [ isLatest, setIsLatest ]                         = useState(true)
    const [ publicationDate, setPublicationDate ]           = useState("")
    const [ releaseInfo, setReleaseInfo ]                   = useState("")
    const [ latestVersion, setLatestVersion ]               = useState("")
    const navigate = useNavigate()

    useEffect(() => {
        isLatestVersion()
        .then((x) => {
            if (x) {
                setIsLatest(x['isLatestVersion'])
                setPublicationDate(x['publicationDate'])
                setReleaseInfo(x['releaseInfo'])
                setLatestVersion(x['latestVersion'])
            }
            else {
                setIsLatest(true)
            }
        })
    }, [])

    let utilities = []
    if (signOut) {
        utilities = [
            {
                type: "button",
                text: "Lookout for Equipment Doc",
                href: "https://docs.aws.amazon.com/lookout-for-equipment/latest/ug/what-is.html",
                external: true,
                externalIconAriaLabel: " (opens in a new tab)"
            },
            {
                type: "button",
                text: "API Doc",
                href: "https://docs.aws.amazon.com/lookout-for-equipment/latest/ug/API_Operations.html",
                external: true,
                externalIconAriaLabel: " (opens in a new tab)"
            },
            {
                type: "menu-dropdown",
                text: user && user.username,
                description: `L4E Demo App v${window.version}`,
                iconName: "user-profile",
                items: [
                    { id: "feedback", text: "Feedback", href: "mailto:aws-custfeedback-l4edemoapp@amazon.fr?subject=Lookout%20for%20Equipment%20Demo%20App%20Feedback", external: true }
                ]
            },
            {
                type: "button",
                iconName: "settings",
                onClick: () => setShowSettingsModal(true)
            },
            {
                type: "button",
                text: "Sign Out",
                onClick: () => setShowSignOutModal(true)
                // onClick: () => signOut()
            }
        ]

        if (!isLatest) {
            utilities = [{
                type: "button",
                iconName: "notification",
                badge: true,
                title: "Notifications",
                onClick: () => setShowReleaseInfoModal(true)
            }, ...utilities]
        }

        // Render the component:
        return (
            <>
                <Settings visible={showSettingsModal} onDiscard={() => setShowSettingsModal(false)} user={user} />
                <SignOutConfirmation visible={showSignOutModal} onDiscard={() => setShowSignOutModal(false)} signOut={() => signOut()} />

                { !isLatest && <ReleaseInfo 
                    visible={showReleaseInfoModal} 
                    onDiscard={() => setShowReleaseInfoModal(false)} 
                    releaseInfo={releaseInfo} 
                    publicationDate={publicationDate} 
                    latestVersion={latestVersion}
                /> }

                <TopNavigation
                    identity={{
                        title: "Amazon Lookout for Equipment Demonstration",
                        href: "#",
                        onFollow: () => navigate('/'),
                        logo: {
                            src: "/lookout-equipment-icon-32.png",
                            alt: "Amazon Lookout for Equipment Demonstration"
                        }
                    }}
                    utilities={utilities}
                />
            </>
        )
    }
}

export default TopMenuBar