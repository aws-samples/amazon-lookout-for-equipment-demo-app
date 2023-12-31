import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import ApiGatewayContext from './ApiGatewayContext'
import { getModelList } from '../../utils/utils'

const ModelParametersContext = createContext()

export const ModelParametersProvider = ({children}) => {
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { projectName } = useParams()

    const [ selectedItems, setSelectedItems ] = useState([])
    const [ currentPageIndex, setCurrentPageIndex ] = useState(1)
    const [ allChecked, setAllChecked ] = useState(true)
    const [ selectedOption, setSelectedOption ] = useState({ label: "Lesser or equal than", value: "<" })
    const [ selectedSignal, setSelectedSignal ] = useState({label: 'No off time detection', value: undefined})
    const [ offConditionValue, setOffConditionValue ] = useState(0.0)
    const [ selectedSamplingRate, setSelectedSamplingRate] = useState({ label: "5 minutes", value: "PT5M" })
    const [ offtimeMin, setOfftimeMin ] = useState(undefined)
    const [ offtimeMax, setOfftimeMax ] = useState(undefined)
    const [ tempSelectedItems, setTempSelectedItems ]   = useState([])

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
    const listModels = useRef([])
    const defaultModelConfig = useRef({})
    const signalsList = useRef("")

    useEffect(() => {
        getModelList(gateway, uid + '-' + projectName)
        .then((x) => listModels.current = x)
    }, [gateway])

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
            listModels,
            selectedSamplingRate,
            defaultModelConfig,
            offtimeMin,
            offtimeMax,
            signalsList,
            tempSelectedItems,

            setSelectedItems,
            setCurrentPageIndex,
            setAllChecked,
            setSelectedOption,
            setSelectedSignal,
            setOffConditionValue,
            setSelectedSamplingRate,
            setOfftimeMin,
            setOfftimeMax,
            setTempSelectedItems
        }}>
            {children}
        </ModelParametersContext.Provider>
    )
}

export default ModelParametersContext