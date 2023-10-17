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
import { getLegendWidth, checkLabelGroupNameAvailability } from '../../utils/utils.js'

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
    const [ labelCreationProgress, setLabelCreationProgress ]         = useState(0)
    const [ progressBarVisible, setProgressBarVisible ]               = useState(false)
    const [ invalidNameErrorMessage, setInvalidNameErrorMessage ]     = useState("")

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

    // --------------------------------------------------------------------------------
    // This functions collects all the labels associated with the selected label groups
    // --------------------------------------------------------------------------------
    async function getLabels(selectedLabelGroup, setLabelGroupName) {
        let currentLabelGroupName = selectedLabelGroup['value']
        selectedLabelGroupValue.current = selectedLabelGroup['value']
        labels.current = []
        storedRanges.current = []

        if (currentLabelGroupName === 'NewGroup') {
            setLabelGroupName("")
            selectedLabelGroupName.current = ""
            selectedLabelGroupValue.current = undefined
            setDeleteButtonDisabled(true)
            setUpdateButtonDisabled(true)
            setLabelCreationProgress(0)
            setProgressBarVisible(false)
        }
        else {
            const response = await gateway.lookoutEquipment
                                            .listLabels(currentLabelGroupName)
                                            .catch((error) => console.log(error.response))

            if (response['LabelSummaries'].length > 0) {
                response['LabelSummaries'].forEach((label) => {
                    labels.current.push({
                        start: new Date(label['StartTime'] * 1000),
                        end: new Date(label['EndTime'] * 1000)
                    })

                    storedRanges.current.push({
                        brushType: 'lineX',
                        coordRange: [label['StartTime'] * 1000, label['EndTime'] * 1000],
                        coordRanges: [[label['StartTime'] * 1000, label['EndTime'] * 1000]]
                    })
                })

                setDeleteButtonDisabled(false)
                setUpdateButtonDisabled(false)
            }

            currentLabelGroupName = currentLabelGroupName.substring(uid.length + 1 + projectName.length + 1, currentLabelGroupName.length)
            setLabelGroupName(currentLabelGroupName)
            selectedLabelGroupName.current = currentLabelGroupName
        }

        labelsTableRef.current.updateTable(labels.current)
        redrawBrushes(eChartRef, labels)
    }

    // -------------------------------------------------
    // Only checks errors linked to the label group name
    // -------------------------------------------------
    async function checkLabelGroupNameErrors(labelGroupName) {
        let error = true
        let msg = ""
    
        // Error checking:
        if (labelGroupName.length <= 2) {
            msg = 'Label group name must be at least 3 characters long'
        }
        else if (! /^([a-zA-Z0-9_\-]{1,170})$/.test(labelGroupName)) {
            msg = 'Label group name can have up to 170 characters. Valid characters are a-z, A-Z, 0-9, _ (underscore), and - (hyphen)'
        }
        else if (! await checkLabelGroupNameAvailability(gateway, uid, projectName, labelGroupName)) {
            msg = 'Label group name not available'
        }
        else {
            error = false
        }

        setInvalidNameErrorMessage(msg)
        return {error, msg}
    }

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
            labelCreationProgress,
            progressBarVisible,
            invalidNameErrorMessage,

            setDeleteButtonDisabled,
            setShowDeleteLabelGroupModal,
            setShowUpdateLabelGroupModal,
            setUpdateButtonDisabled,
            setSelectedOption,
            setGroupLabelOptions,
            setLabelCreationProgress,
            setProgressBarVisible,
            setInvalidNameErrorMessage,

            getLabels,
            checkLabelGroupNameErrors
        }}>
            {children}
        </LabelingContext.Provider>
    )
}

export default LabelingContext