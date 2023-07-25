import { useNavigate } from "react-router-dom"
import TopNavigation from "@cloudscape-design/components/top-navigation"

// =====================================================================
// Component main entry point. This component manages the top menu bar 
// appearing on all screens. Beyond the title, it includes the ability 
// to sign out and provides features linked to the current user profile:
// =====================================================================
function TopMenuBar({ user, signOut }) {
    const navigate = useNavigate()

    // Render the component:
    return (
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
            utilities={[
                {
                    type: "menu-dropdown",
                    text: user && user.username,
                    description: user && user.attributes['email'],
                    iconName: "user-profile",
                    items: [
                        { id: "preferences", text: "Preferences" },
                        { id: "feedback", text: "Feedback", href: "#", external: true },
                    ]
                },
                {
                    type: "button",
                    text: "Sign Out",
                    onClick: () => signOut()
                }
            ]}
        />
    )
}

export default TopMenuBar