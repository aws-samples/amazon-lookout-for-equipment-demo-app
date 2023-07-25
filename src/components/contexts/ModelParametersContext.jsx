import { createContext, useRef, useState } from 'react'

const ModelParametersContext = createContext()

export const ModelParametersProvider = ({children}) => {
    const [selectedItems, setSelectedItems] = useState([])
    const [currentPageIndex, setCurrentPageIndex] = useState(1)
    const [allChecked, setAllChecked] = useState(false)
    const [ selectedOption, setSelectedOption ] = useState({ label: "Lesser or equal than", value: "<" })
    const [ selectedSignal, setSelectedSignal ] = useState({label: 'No off time detection', value: undefined})
    const [ offConditionValue, setOffConditionValue ] = useState(0.0)

    const trainingRange = useRef(undefined)
    const evaluationRange = useRef(undefined)
    const numTrainingDays = useRef("0 day(s)")
    const numEvaluationDays = useRef("0 day(s)")
    const labels = useRef([])
    const totalLabelDuration = useRef(0)
    const datasetName = useRef("")
    const modelName = useRef("")
    const selectedLabelGroupName = useRef(undefined)
    const selectedLabelGroupValue = useRef(undefined)

    return (
        <ModelParametersContext.Provider value={{
            trainingRange,
            evaluationRange,
            numTrainingDays,
            numEvaluationDays,
            selectedItems,
            currentPageIndex,
            labels,
            totalLabelDuration,
            allChecked,
            datasetName,
            modelName,
            selectedOption,
            selectedSignal,
            offConditionValue,
            selectedLabelGroupName,
            selectedLabelGroupValue,

            setSelectedItems,
            setCurrentPageIndex,
            setAllChecked,
            setSelectedOption,
            setSelectedSignal,
            setOffConditionValue
        }}>
            {children}
        </ModelParametersContext.Provider>
    )
}

export default ModelParametersContext