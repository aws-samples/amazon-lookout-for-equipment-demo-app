import { createContext, useState } from 'react'

const ModelDeploymentContext = createContext()

export const ModelDeploymentProvider = ({ children }) => {
    const [ stateMachinesList, setStateMachinesList ] = useState({})

    return (
        <ModelDeploymentContext.Provider value={{
            stateMachinesList,
            setStateMachinesList,
        }}>
            {children}
        </ModelDeploymentContext.Provider>
    )
}

export default ModelDeploymentContext