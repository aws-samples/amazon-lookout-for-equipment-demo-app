import { createContext, useState, useRef } from 'react'

const SensorOverviewContext = createContext()

export const SensorOverviewProvider = ({ children }) => {
    const zoomStart = useRef(0)
    const zoomEnd = useRef(100)
    const [currentBrushes, setCurrentBrushes] = useState([])
    const [selectedRanges, setSelectedRanges] = useState([])

    return (
        <SensorOverviewContext.Provider value={{
            zoomStart,
            zoomEnd,
            currentBrushes,
            selectedRanges,

            setCurrentBrushes,
            setSelectedRanges
        }}>
            {children}
        </SensorOverviewContext.Provider>
    )
}

export default SensorOverviewContext