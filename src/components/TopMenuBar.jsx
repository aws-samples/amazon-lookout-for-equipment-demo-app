// Imports:
import { useContext, useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom"

// CloudScape components:
import Box           from "@cloudscape-design/components/box"
import Button        from "@cloudscape-design/components/button"
import Checkbox      from "@cloudscape-design/components/checkbox"
import FormField     from "@cloudscape-design/components/form-field"
import Modal         from "@cloudscape-design/components/modal"
import SpaceBetween  from "@cloudscape-design/components/space-between"
import TopNavigation from "@cloudscape-design/components/top-navigation"

// Context:
import ApiGatewayContext from './contexts/ApiGatewayContext'

// =====================================================================
// Component main entry point. This component manages the top menu bar 
// appearing on all screens. Beyond the title, it includes the ability 
// to sign out and provides features linked to the current user profile:
// =====================================================================
function TopMenuBar({ user, signOut }) {
    const [ showSettingsModal, setShowSettingsModal ] = useState(false)
    const navigate = useNavigate()

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
                <Settings visible={showSettingsModal} onDiscard={() => setShowSettingsModal(false)} />
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

// --------------------------------------------
// Components used to configure the application
// --------------------------------------------
function Settings({ visible, onDiscard }) {
    const { gateway, uid, showHelp, isAdmin } = useContext(ApiGatewayContext)
    const [ checked, setChecked ] = useState(showHelp.current)
    
    useEffect(() => {
        getUserSettings(gateway, uid, showHelp, isAdmin)
        .then((x) => setChecked(x.showHelp) )
    }, [gateway, uid])

    // Save current settings:
    async function onSaveSettings(e) {
        e.preventDefault()

        await gateway.dynamoDb.putItem(
            `l4edemoapp-users-${window.stackId}`,
            {
                'user_id': {'S': uid},
                'show_help': {'BOOL': showHelp.current},
                'is_admin': {'BOOL': isAdmin.current}
            }
        ).catch((error) => console.log(error.response))
        
        onDiscard()
    }

    // Renders the modal window for the settings components:
    return (
        <Modal 
            visible={visible} 
            onDismiss={onDiscard} 
            header="Application settings"
            footer={
                <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={onDiscard}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={(e) => onSaveSettings(e)}>
                            Save
                        </Button>
                    </SpaceBetween>
                </Box>
              }
        >
            <FormField 
                label="Show user guide"
                description={`This application includes some user guides scattered through the different 
                              pages. They will guide you as you get familiar with the application. Once
                              you feel comfortable with the navigation, feel free to hide these and 
                              reclaim some screen real estate`}
            >
                <Checkbox
                    onChange={({ detail }) => {
                        showHelp.current = detail.checked
                        setChecked(detail.checked)
                    }}
                    checked={checked}
                >
                    Show help
                </Checkbox>
            </FormField>
        </Modal>
    )
}

// ------------------------------------
// Collects user settings from DynamoDB
// ------------------------------------
async function getUserSettings(gateway, uid, showHelp, isAdmin) {
    const userQuery = { 
        TableName: `l4edemoapp-users-${window.stackId}`,
        KeyConditionExpression: "#user = :user",
        ExpressionAttributeNames: {"#user": "user_id"},
        ExpressionAttributeValues: { 
            ":user": {"S": uid}, 
        }
    }

    const response = await gateway
                     .dynamoDb.queryAll(userQuery)
                     .catch((error) => console.log(error.response))

    if (response.Items.length == 0) {
        await createUser(gateway, uid, showHelp)
        isAdmin.current = false
    }
    else {
        showHelp.current = response.Items[0].show_help.BOOL
        isAdmin.current = response.Items[0].is_admin.BOOL
    }

    return {
        showHelp: showHelp.current,
        isAdmin: isAdmin.current
    }
}

// -------------------------------------------------
// A user connects for the first time to the app: we 
// create his/her record in the users DynamoDB table
// -------------------------------------------------
async function createUser(gateway, uid, showHelp) {
    await gateway.dynamoDb.putItem(
        `l4edemoapp-users-${window.stackId}`,
        {
            'user_id': {'S': uid},
            'show_help': {'BOOL': true},
            'is_admin': {'BOOL': false}
        }
    ).catch((error) => console.log(error.response))

    showHelp.current = true
}

export default TopMenuBar