// Imports:
import { useContext, useEffect, useState } from 'react'

// CloudScape components:
import Box           from "@cloudscape-design/components/box"
import Button        from "@cloudscape-design/components/button"
import Checkbox      from "@cloudscape-design/components/checkbox"
import FormField     from "@cloudscape-design/components/form-field"
import Modal         from "@cloudscape-design/components/modal"
import SpaceBetween  from "@cloudscape-design/components/space-between"

// Context:
import ApiGatewayContext from '../contexts/ApiGatewayContext'

// --------------------------------------------
// Components used to configure the application
// --------------------------------------------
function Settings({ visible, onDiscard, user }) {
    const { gateway, uid, showHelp, setShowHelp, isAdmin } = useContext(ApiGatewayContext)
    const [ checked, setChecked ] = useState(showHelp)
    
    useEffect(() => {
        getUserSettings(gateway, user, uid, showHelp, setShowHelp, isAdmin)
        .then((x) => setChecked(x.showHelp) )
    }, [gateway, uid, showHelp])

    // Save current settings:
    async function onSaveSettings(e) {
        e.preventDefault()

        await gateway.dynamoDb.putItem(
            `l4edemoapp-users-${window.stackId}`,
            {
                'user_id': {'S': uid},
                'show_help': {'BOOL': checked},
                'is_admin': {'BOOL': isAdmin.current}
            }
        ).catch((error) => console.log(error.response))
        
        setShowHelp(checked)
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
                        // setShowHelp(detail.checked)
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
async function getUserSettings(gateway, user, uid, showHelp, setShowHelp, isAdmin) {
    if (!user) {
        return {
            showHelp: false,
            isAdmin: false
        }
    }

    const userQuery = { 
        TableName: `l4edemoapp-users-${window.stackId}`,
        KeyConditionExpression: "#user = :user",
        ExpressionAttributeNames: {"#user": "user_id"},
        ExpressionAttributeValues: { 
            ":user": {"S": uid}, 
        }
    }

    try {
        const response = await gateway
                        .dynamoDb.queryAll(userQuery)
                        .catch((error) => console.log(error.response))

        if (response.Items.length == 0) {
            await createUser(gateway, uid, showHelp, setShowHelp, user.attributes.email)
            isAdmin.current = false
        }
        else {
            setShowHelp(response.Items[0].show_help.BOOL)
            isAdmin.current = response.Items[0].is_admin.BOOL
        }

        return {
            showHelp: showHelp,
            isAdmin: isAdmin.current
        }
    }

    // If the user authentication is not through yet, we skip this function:
    catch (error) {
        console.log(error)
        console.log(userQuery)

        return {
            showHelp: false,
            isAdmin: false
        }
    }
}

// -------------------------------------------------
// A user connects for the first time to the app: we 
// create his/her record in the users DynamoDB table
// -------------------------------------------------
async function createUser(gateway, uid, showHelp, setShowHelp, email) {
    await gateway.dynamoDb.putItem(
        `l4edemoapp-users-${window.stackId}`,
        {
            'user_id': {'S': uid},
            'show_help': {'BOOL': true},
            'is_admin': {'BOOL': false},
            'email': {'S': email}
        }
    ).catch((error) => console.log(error.response))

    setShowHelp(true)
}

export default Settings