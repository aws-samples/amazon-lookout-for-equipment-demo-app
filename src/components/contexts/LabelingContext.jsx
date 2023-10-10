// Imports:
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

// Contexts:
import ApiGatewayContext      from './ApiGatewayContext'
import ModelParametersContext from './ModelParametersContext'
import TimeSeriesContext      from './TimeSeriesContext'

// Utils:
import { redrawBrushes, getLabelGroups } from '../labelling/labelingUtils.js'
import { buildChartOptions } from '../../utils/timeseries.js'
import { getLegendWidth } from '../../utils/utils.js'

const LabelingContext = createContext()

export const LabelingContextProvider = ({ children, readOnly }) => {
    // -------------------------
    // Getting component context
    // -------------------------
    let emptyGroupName = 'No label'
    if (!readOnly) { emptyGroupName = 'Create a new group' }
    const { labels, selectedLabelGroupName, selectedLabelGroupValue } = useContext(ModelParametersContext)
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { data, tagsList, timeseriesData } = useContext(TimeSeriesContext)
    const { projectName } = useParams()

    // ----------------------------
    // Defining new context content
    // ----------------------------
    const eChartRef      = useRef(null)
    const labelsTableRef = useRef(undefined)
    const storedRanges   = useRef([])

    const [ deleteButtonDisabled, setDeleteButtonDisabled]            = useState(!selectedLabelGroupName.current ? true : false)
    const [ updateButtonDisabled, setUpdateButtonDisabled]            = useState(!selectedLabelGroupName.current ? true : false)
    const [ showDeleteLabelGroupModal, setShowDeleteLabelGroupModal ] = useState(false)
    const [ showUpdateLabelGroupModal, setShowUpdateLabelGroupModal ] = useState(false)
    const [ groupLabelOptions, setGroupLabelOptions ]                 = useState([{}])
    const [ selectedOption, setSelectedOption] = useState(
        !selectedLabelGroupName.current 
        ? {label: emptyGroupName, value: 'NewGroup'} 
        : {label: selectedLabelGroupName.current, value: selectedLabelGroupValue.current}
    )

    // ---------------------------
    // Loads existing label groups
    // ---------------------------
    useEffect(() => {
        getLabelGroups(gateway, uid, projectName, emptyGroupName)
        .then((x) => setGroupLabelOptions(x))
    }, [gateway, projectName])

    // -------------------------------------
    // Build the eChart configuration object
    // -------------------------------------
    let option = undefined
    if (data) {
        option = buildChartOptions(
            tagsList, 
            timeseriesData, 
            0,                                      // initialZoomStart
            100,                                    // initialZoomEnd
            true,                                   // showLegend, 
            true,                                   // showToolbox, 
            getLegendWidth(tagsList),               // Width in pixels of the legend
            true,                                   // enableBrush
            false,                                  // customDatazoomColor
            readOnly,                               // readOnly
            5,                                      // showTopN,
            false,                                  // frozenMarkers
            labels.current                          // existingMarkers
        )
    }

    // -------------------
    // Provider definition
    // -------------------
    return (
        <LabelingContext.Provider value={{
            deleteButtonDisabled,
            updateButtonDisabled,
            showDeleteLabelGroupModal,
            showUpdateLabelGroupModal,
            selectedOption,
            emptyGroupName,
            groupLabelOptions,
            option,
            eChartRef,
            labelsTableRef,
            storedRanges,

            setDeleteButtonDisabled,
            setShowDeleteLabelGroupModal,
            setShowUpdateLabelGroupModal,
            setUpdateButtonDisabled,
            setSelectedOption,
            setGroupLabelOptions
        }}>
            {children}
        </LabelingContext.Provider>
    )
}

export default LabelingContext