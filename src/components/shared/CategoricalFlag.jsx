import Box from "@cloudscape-design/components/box"
import Badge from "@cloudscape-design/components/badge"

function CategoricalFlag ({type}) {
    let color = 'green'
    let text = 'No issue'

    if (type === "POTENTIAL_ISSUE_DETECTED") {
        color = 'red'
        text = 'Potential'
    }

    return (
        <Box textAlign="center">
            <Badge color={color}>{text}</Badge>
        </Box>
    )
}

export default CategoricalFlag