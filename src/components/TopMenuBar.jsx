// Imports:
import { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom"
import { Octokit } from "@octokit/core"

// CloudScape components:
import TopNavigation from "@cloudscape-design/components/top-navigation"

// App component:
import Settings from './topMenuBar/Settings'

async function getLatestVersion() {
    const octokit = new Octokit({
        auth: 'token'
    })
      
    const response = await octokit.request('GET /repos/{owner}/{repo}/releases/tags/{tag}', {
        owner: 'aws-samples',
        repo: 'amazon-lookout-for-equipment-demo-app',
        tag: 'Beta1',
        headers: { 'X-GitHub-Api-Version': '2022-11-28' }
    })

    return response.data.tag_name
}

// =====================================================================
// Component main entry point. This component manages the top menu bar 
// appearing on all screens. Beyond the title, it includes the ability 
// to sign out and provides features linked to the current user profile:
// =====================================================================
function TopMenuBar({ user, signOut }) {
    // const { uid } = useContext(ApiGatewayContext)
    const [ showSettingsModal, setShowSettingsModal ] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        getLatestVersion()
        .then((x) => console.log(x))
    }, [])

    let utilities = []
    if (signOut) {
        utilities = [
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
                onClick: () => signOut()
            }
        ]

        // Render the component:
        return (
            <>
                <Settings visible={showSettingsModal} onDiscard={() => setShowSettingsModal(false)} user={user} />
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