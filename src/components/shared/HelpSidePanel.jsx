import { helpPanelContent } from "./HelpPanelContent"
import HelpPanel from "@cloudscape-design/components/help-panel"

function HelpSidePanel({ page, section }) {
    const { header, footer, body } = helpPanelContent[page][section]


    return (
        <HelpPanel header={header} footer={footer}>
            {body}
        </HelpPanel>
    )
}

export default HelpSidePanel