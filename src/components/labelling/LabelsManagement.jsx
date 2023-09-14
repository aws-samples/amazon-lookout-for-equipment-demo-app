// Imports
import { useRef, useCallback, useContext, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactEcharts from "echarts-for-react"

// Application components:
import LabelsTable from "./LabelsTable"
import DeleteLabelGroupModal from "./DeleteLabelGroupModal"

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
import Button       from "@cloudscape-design/components/button"
import FormField    from '@cloudscape-design/components/form-field'
import Input        from "@cloudscape-design/components/input"
import Link         from "@cloudscape-design/components/link"
import Select       from "@cloudscape-design/components/select"
import SpaceBetween from "@cloudscape-design/components/space-between"

// Contexts:
import TimeSeriesContext      from '../contexts/TimeSeriesContext'
import ModelParametersContext from '../contexts/ModelParametersContext'
import ApiGatewayContext      from '../contexts/ApiGatewayContext'
import HelpPanelContext       from '../contexts/HelpPanelContext'

// Utils:
import "../../styles/chartThemeMacarons.js"
import { getLegendWidth, checkLabelGroupNameAvailability } from '../../utils/utils.js'
import { buildChartOptions } from '../../utils/timeseries.js'
import { 
    redrawBrushes,
    onBrushEndEvent,
    onClear,
    getLabelGroups,
} from './labelingUtils.js'

function LabelsManagement({ componentHeight, readOnly }) {
    let emptyGroupName = 'No label'
    if (!readOnly) {
        emptyGroupName = 'Create a new group'
    }

    // Load context variables:
    const { 
        labels, 
        selectedLabelGroupName, 
        selectedLabelGroupValue 
    } = useContext(ModelParametersContext)
    const { data, tagsList, x, signals, timeseriesData } = useContext(TimeSeriesContext)
    const { gateway, uid, showHelp } = useContext(ApiGatewayContext)
    const { setHelpPanelOpen } = useContext(HelpPanelContext)
    const { projectName } = useParams()

    // Define component state:
    const labelsTableRef = useRef(undefined)
    const eChartRef = useRef(null)
    const [ labelGroupName, setLabelGroupName ]                      = useState(!selectedLabelGroupName.current ? "" : selectedLabelGroupName.current)
    const [ groupLabelOptions, setGroupLabelOptions ]                = useState([{}])
    const [ deleteButtonDisabled, setDeleteButtonDisabled]           = useState(!selectedLabelGroupName.current ? true : false)
    const [ showDeleteLabelGroupModal, setShowDeleteLabelGroupModal] = useState(false)
    const [ errorMessage, setErrorMessage ]                          = useState("")
    const [ invalidName, setInvalidName ]                            = useState(false)
    const [ invalidNameErrorMessage, setInvalidNameErrorMessage ]    = useState("")
    const [ noLabelDefined, setNoLabelDefined ]                      = useState(false)
    const [ showUserGuide, setShowUserGuide ]                        = useState(true)
    const [ selectedOption, setSelectedOption] = useState(
        !selectedLabelGroupName.current 
        ? {label: emptyGroupName, value: 'NewGroup'} 
        : {label: selectedLabelGroupName.current, value: selectedLabelGroupValue.current}
    )

    if (!componentHeight) { componentHeight = 350 }

    useEffect(() => {
        getLabelGroups(gateway, uid, projectName, emptyGroupName)
        .then((x) => setGroupLabelOptions(x))
    }, [gateway, projectName])

    // ----------------------------------------------------------
    // Shows an information message if the data is not loaded yet
    // ----------------------------------------------------------
    if (!data.timeseries) {
        return (
            <Alert header="Data preparation in progress">
                Data preparation and ingestion in the app still in progress: after uploading your
                dataset, the app prepares it to optimize visualization speed. This step usually 
                takes 10 to 20 minutes depending on the size of the dataset you uploaded.
            </Alert>
        )
    }

    // ------------------------------------------------------
    // Once the data is loaded, we can display the component:
    // ------------------------------------------------------
    else if (data) {
        const option = buildChartOptions(
            tagsList, 
            timeseriesData, 
            0,                          // initialZoomStart
            100,                        // initialZoomEnd
            true,                       // showLegend, 
            true,                       // showToolbox, 
            getLegendWidth(tagsList),   // Width in pixels of the legend
            true,                       // enableBrush
            false,                      // customDatazoomColor
            readOnly,                   // readOnly
            5,                          // showTopN,
            selectedOption.value !== "NewGroup"
        )

        const modelTrainingLink = <Link 
        href={`/model-training/ProjectName/${projectName}`}
        onFollow={(e) => { 
            e.preventDefault()
            navigate(`/model-training/ProjectName/${projectName}`)
        }}>Model training</Link>

        // --------------------------------------------------------------------------------
        // This functions collects all the labels associated with the selected label groups
        // --------------------------------------------------------------------------------
        async function getLabels(selectedLabelGroup) {
            let currentLabelGroupName = selectedLabelGroup['value']
            selectedLabelGroupValue.current = selectedLabelGroup['value']

            if (currentLabelGroupName === 'NewGroup') {
                labels.current = []
                setLabelGroupName("")
                selectedLabelGroupName.current = ""
                selectedLabelGroupValue.current = undefined
                setDeleteButtonDisabled(true)
            }
            else {
                const response = await gateway.lookoutEquipment.listLabels(currentLabelGroupName)

                if (response['LabelSummaries'].length > 0) {
                    const startTime = new Date(x[0]).getTime() / 1000
                    const endTime = new Date(x[x.length - 1]).getTime() / 1000
                    const totalRange = endTime - startTime

                    let currentRanges = []
                    response['LabelSummaries'].forEach((label) => {
                        currentRanges.push({
                            // start: Math.floor((label['StartTime'] - startTime)/totalRange * x.length), 
                            // end: Math.floor((label['EndTime'] - startTime)/totalRange * x.length)

                            start: new Date(label['StartTime'] * 1000),
                            end: new Date(label['EndTime'] * 1000)
                        })
                    })

                    setDeleteButtonDisabled(false)
                    labels.current = currentRanges
                }

                // selectedLabelGroupValue.current = currentLabelGroupName
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

        // -------------------------------------------
        // Error checking at label group creation time
        // -------------------------------------------
        async function checkLabelGroupErrors(labelGroupName) {
            let { error, msg } = await checkLabelGroupNameErrors(labelGroupName)

            if (error == false) {
                if (labels.current.length == 0) {
                    msg = 'You must define labels using the signal overview below'
                    error = true
                    setInvalidName(false)
                    setNoLabelDefined(true)
                }
                else {
                    setNoLabelDefined(false)
                }
            }
            else {
                setInvalidName(true)
            }

            setErrorMessage(msg)
            return {error, msg}
        }

        // -----------------------------------------------------------------------
        // This function is called when the user wants to create a new label group
        // -----------------------------------------------------------------------
        const createLabelGroup = async (e) => {
            e.preventDefault()
            const { error } = await checkLabelGroupErrors(labelGroupName, projectName)

            if (!error) {
                const labelGroupRequest = {
                    LabelGroupName: uid + '-' + projectName + '-' + labelGroupName,
                    Tags: [{ 'Key': 'ProjectName', 'Value': projectName }]
                }

                await gateway.lookoutEquipment.createLabelGroup(labelGroupRequest)
                    .catch((error) => { console.log(error.response) })

                labels.current.forEach(async (label) => {
                    const labelRequest = {
                        LabelGroupName: uid + '-' + projectName + '-' + labelGroupName,
                        StartTime: new Date(label['start']).getTime() / 1000,
                        EndTime: new Date(label['end']).getTime() / 1000,
                        Rating: 'ANOMALY'
                    }

                    await gateway.lookoutEquipment.createLabel(labelRequest)
                        .catch((error) => { console.log(error.response) })

                    // Wait to prevent label creation throttling:
                    await new Promise(r => setTimeout(r, 400))
                })

                const labelGroupOptions = await getLabelGroups(gateway, uid, projectName)
                setGroupLabelOptions(labelGroupOptions)
                setSelectedOption({label: labelGroupName, value: uid + '-' + projectName + '-' + labelGroupName})
                setDeleteButtonDisabled(false)
                selectedLabelGroupName.current = labelGroupName
                selectedLabelGroupValue.current = uid + '-' + projectName + '-' + labelGroupName
            }
        }

        // ------------------------------------------------------------
        // Deletes the current label group and reset the rest of the UI
        // ------------------------------------------------------------
        const deleteLabelGroup = async () => {
            // Delete the selected label group:
            const labelGroupName = selectedOption['value']
            await gateway.lookoutEquipment
                .deleteLabelGroup(labelGroupName)
                .catch((error) => console.log(error.response))

            // Update the label group list:
            const labelGroupOptions = await getLabelGroups(gateway, uid, projectName)
            setGroupLabelOptions(labelGroupOptions)

            // Select the "NoLabel" option and clear the rest of the UI:
            setSelectedOption({label: emptyGroupName, value: 'NewGroup'})
            labels.current = []
            setLabelGroupName("")
            selectedLabelGroupName.current = ""
            selectedLabelGroupValue.current = undefined
            setDeleteButtonDisabled(true)
            labelsTableRef.current.updateTable(labels.current)
            redrawBrushes(eChartRef, labels)
            setShowDeleteLabelGroupModal(false)
        }

        // ----------------------
        // Renders the component:
        // ----------------------
        return (
            <>
                <DeleteLabelGroupModal 
                    visible={showDeleteLabelGroupModal} 
                    onDiscard={() => { setShowDeleteLabelGroupModal(false) }} 
                    onDelete={async () => { await deleteLabelGroup() }}
                    selectedLabelGroup={selectedOption ? selectedOption['value'].slice(uid.length + projectName.length + 2) : ""}
                    internalLabelGroupName={selectedOption ? selectedOption['value'] : ""}
                />

                <SpaceBetween size="xl">
                    { errorMessage !== "" && <Alert type="error">{errorMessage}</Alert> }

                    { !readOnly && showHelp.current && showUserGuide && <Alert dismissible={true} onDismiss={() => setShowUserGuide(false)}>
                        <p>
                            If you don't know about any historical events of interest in your dataset, feel free to
                            skip this step and go to <b>{modelTrainingLink}</b>.
                        </p>

                        <p>
                            Use this page to label your time series data with past historical events. For instance,
                            you may leverage time ranges related to past maintenance records or known failures that
                            are not contingent to normal operating conditions of your equipment or process.
                            Lookout for Equipment only leverages unsupervised approaches and this labeling step
                            is <b>completely optional</b>. Most users start their experimentation with the service
                            without defining any label. Based on the first results, they then iterate to improve
                            the detection capabilities of their model or their forewarning time.
                        </p>
                    </Alert> }

                    {/***************************************************************
                     * This section is only displayed when the component is read only 
                     ***************************************************************/ }
                    {readOnly && <FormField 
                        label="Select a label group (optional)" 
                        description="You can load a group of labels previously defined using the following drop down."
                        info={
                            <Link variant="info" onFollow={() => setHelpPanelOpen({
                                status: true,
                                page: 'labelling',
                                section: 'selectLabelGroupReadOnly'
                            })}>Info</Link>
                        }
                    >
                        <Select
                            selectedOption={selectedOption}
                            onChange={({ detail }) => {
                                setSelectedOption(detail.selectedOption)
                                getLabels(detail.selectedOption)
                            }}
                            options={groupLabelOptions}
                            placeholder="Select an existing group to load the associated labels"
                        />
                    </FormField> }

                    { readOnly && labels.current && labels.current.length > 0 && <FormField 
                        label="Signal overview" 
                        description="Use the following plot to preview the selected labels on your actual signals"
                        stretch={true}>

                        <ReactEcharts 
                            option={option}
                            theme="macarons"
                            style={{ height: componentHeight, width: "100%" }}
                            ref={eChartRef}
                            onChartReady={(e) => { redrawBrushes(eChartRef, labels) }}
                        />

                    </FormField> }

                    {/*******************************************************************
                     * This section is only displayed when the component is NOT read only 
                     *******************************************************************/ }
                    { !readOnly && groupLabelOptions.length > 1 && <FormField 
                            label="Select an existing label group" 
                            description="Using this drop down, you can load a group of labels previously 
                                         defined to visualize them over your time series."
                            info={
                                <Link variant="info" onFollow={() => setHelpPanelOpen({
                                    status: true,
                                    page: 'labelling',
                                    section: 'selectLabelGroup'
                                })}>Info</Link>
                            }
                            secondaryControl={
                                <Button disabled={deleteButtonDisabled} 
                                        onClick={() => { setShowDeleteLabelGroupModal(true) }}>
                                    Delete group
                                </Button>
                            }
                    >
                        <Select
                            selectedOption={selectedOption}
                            onChange={({ detail }) => {
                                setSelectedOption(detail.selectedOption)
                                getLabels(detail.selectedOption)
                            }}
                            options={groupLabelOptions}
                            placeholder="Select an existing group to load the associated labels"
                        />
                    </FormField> }

                    { selectedOption.value === "NewGroup" && !readOnly && <FormField
                        description="Give a name to your label group"
                        label="Label group name"
                        constraintText={invalidNameErrorMessage !== "" ? invalidNameErrorMessage : ""}
                        info={
                            <Link variant="info" onFollow={() => setHelpPanelOpen({
                                status: true,
                                page: 'labelling',
                                section: 'labelGroupName'
                            })}>Info</Link>
                        }
                        secondaryControl={
                            <SpaceBetween size="s" direction="horizontal">
                                <Button 
                                    variant="primary" 
                                    onClick={(e) => createLabelGroup(e)}
                                    disabled={invalidNameErrorMessage !== ""}
                                >Create group</Button>
                            </SpaceBetween>
                        }
                    >
                        <Input 
                            onChange={({ detail }) => {
                                checkLabelGroupNameErrors(detail.value)
                                setLabelGroupName(detail.value)
                            }}
                            value={labelGroupName}
                            placeholder="Enter a label group name"
                            invalid={invalidNameErrorMessage !== ""}
                        />
                    </FormField> }

                    { !readOnly && <FormField 
                        label="Signal overview" 
                        description="Use the following plot to preview the selected labels on your actual signals. Use the
                                    labels selection control (red icons) on the top right of the plot below to select time
                                    ranges that will be used as labels for your model"
                        info={
                            <Link variant="info" onFollow={() => setHelpPanelOpen({
                                status: true,
                                page: 'labelling',
                                section: 'signalOverview'
                            })}>Info</Link>
                        }
                        stretch={true}>

                        <ReactEcharts 
                            option={option}
                            theme="macarons"
                            style={{ height: componentHeight, width: "100%" }}
                            ref={eChartRef}
                            onEvents={{
                                'brushEnd': useCallback((e) => onBrushEndEvent(e, labels, labelsTableRef), [labels]),
                                'brush': useCallback((e) => {
                                    onClear(e, eChartRef, labels)
                                    if (e['command'] && e['command'] === 'clear') {
                                        if (labelsTableRef && labelsTableRef.current) {
                                            labelsTableRef.current.updateTable([])
                                        }
                                    }
                                }, [labels])
                            }}
                            onChartReady={(e) => { redrawBrushes(eChartRef, labels) }}
                        />

                    </FormField> }

                    {/***********************************************************************************
                     * This section is always displayed whether the component is in read only mode or not
                     ***********************************************************************************/ }
                    <FormField
                        description="This table lists all the labels selected above"
                        label="Labels list"
                        info={
                            <Link variant="info" onFollow={() => setHelpPanelOpen({
                                status: true,
                                page: 'labelling',
                                section: 'labelsTable'
                            })}>Info</Link>
                        }
                        stretch={true}
                    >
                        <LabelsTable ref={labelsTableRef} labels={labels.current} noLabelDefined={noLabelDefined} />
                    </FormField>
                </SpaceBetween>
            </>
        )
    }
}

export default LabelsManagement