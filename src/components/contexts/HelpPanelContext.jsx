import { createContext, useRef, useState } from 'react'
import { helpPanelContent } from "../shared/HelpPanelContent"
import HelpPanel from "@cloudscape-design/components/help-panel"

const HelpPanelContext = createContext()

export const HelpPanelProvider = ({ children }) => {
    const [ helpPanelOpen, setHelpPanelOpen ]   = useState({
        status: false,
        page: undefined,
        section: undefined
    })
    const panelContent = useRef(undefined)

    if (helpPanelOpen.page && helpPanelOpen.section) {
        const { header, footer, body } = helpPanelContent[helpPanelOpen.page][helpPanelOpen.section]
        panelContent.current = (
            <HelpPanel header={header} footer={footer}>
                {body}
            </HelpPanel>
        )
    }

    return (
        <HelpPanelContext.Provider value={{
            panelContent,
            helpPanelOpen,
            setHelpPanelOpen
        }}>
            {children}
        </HelpPanelContext.Provider>
    )
}

export default HelpPanelContext