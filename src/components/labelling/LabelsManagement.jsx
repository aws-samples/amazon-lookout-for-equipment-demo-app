// Imports
import { useRef, useContext, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactEcharts from "echarts-for-react"

// Application components:
import LabelsTable from "./LabelsTable"
import DeleteLabelGroupModal from "./DeleteLabelGroupModal"

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Form         from "@cloudscape-design/components/form"
import FormField    from '@cloudscape-design/components/form-field'
import Input        from "@cloudscape-design/components/input"
import Select       from "@cloudscape-design/components/select"
import SpaceBetween from "@cloudscape-design/components/space-between"

// Contexts:
import TimeSeriesContext      from '../contexts/TimeSeriesContext'
import ModelParametersContext from '../contexts/ModelParametersContext'
import ApiGatewayContext      from '../contexts/ApiGatewayContext'

// Utils:
import { getLegendWidth } from '../../utils/utils.js'
import { buildChartOptions } from '../../utils/timeseries.js'
import "../../styles/chartThemeMacarons.js"

// --------------------------
// Component main entry point
// --------------------------
function LabelsManagement({ componentHeight, readOnly }) {
    const { 
        labels, 
        // totalLabelDuration, 
        selectedLabelGroupName, 
        selectedLabelGroupValue 
    } = useContext(ModelParametersContext)
    const { data, tagsList, x, signals } = useContext(TimeSeriesContext)
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { projectName } = useParams()

    const labelsTableRef = useRef(undefined)
    const eChartRef = useRef(null)

    const [ labelGroupName, setLabelGroupName ] = useState(!selectedLabelGroupName.current ? "" : selectedLabelGroupName.current)
    const [ groupLabelOptions, setGroupLabelOptions ] = useState([{label: 'No label', value: 'NoLabel'}])
    const [ deleteButtonDisabled, setDeleteButtonDisabled] = useState(!selectedLabelGroupName.current ? true : false)
    const [ showDeleteLabelGroupModal, setShowDeleteLabelGroupModal] = useState(false)
    const [ selectedOption, setSelectedOption] = useState(
        !selectedLabelGroupName.current ? undefined : {label: selectedLabelGroupName.current, value: selectedLabelGroupValue.current}
    )

    if (!componentHeight) { componentHeight = 350 }

    // -----------------------------------------------------------------
    // The user can use brushes to highlight labels directly on the plot
    // -----------------------------------------------------------------
    const onBrushEndEvent = (e) => {
        let currentRanges = []
        e["areas"].forEach((area) => {
            currentRanges.push({
                "start": area.coordRange[0],
                "end": area.coordRange[1]
            })
        })

        labels.current = currentRanges
        labelsTableRef.current.updateTable(labels.current)
    }

    // -------------------------------------------------------------------
    // As soon as the chart is ready, we plot the loaded labels as brushes
    // -------------------------------------------------------------------
    function redrawBrushes() {
        if (eChartRef && eChartRef.current) {
            if (labels.current.length > 0) {
                let areasList = []
                labels.current.forEach((label) => {
                    areasList.push({
                        brushType: 'lineX',
                        coordRange: [label['start'], label['end']],
                        xAxisIndex: 0
                    })
                })

                eChartRef.current.getEchartsInstance().dispatchAction({
                    type: 'brush',
                    areas: areasList
                })
            }
        }
    }

    // -----------------------------------------------------------------------
    // This function is called when the user wants to create a new label group
    // -----------------------------------------------------------------------
    const createLabelGroup = async (e) => {
        e.preventDefault()

        if (labels.current.length > 0) {
            const labelGroupRequest = {
                LabelGroupName: uid + '-' + projectName + '-' + labelGroupName,
                Tags: [{ 'Key': 'ProjectName', 'Value': projectName }]
            }

            await gateway.lookoutEquipment.createLabelGroup(labelGroupRequest)
                .catch((error) => { console.log(error.response) })

            labels.current.forEach(async (label) => {
                const labelRequest = {
                    LabelGroupName: uid + '-' + projectName + '-' + labelGroupName,
                    StartTime: new Date(x[label['start']]).getTime() / 1000,
                    EndTime: new Date(x[label['end']]).getTime() / 1000,
                    Rating: 'ANOMALY'
                }

                await gateway.lookoutEquipment.createLabel(labelRequest)
                    .catch((error) => { console.log(error.response) })
            })

            const labelGroupOptions = await getLabelGroups()
            setGroupLabelOptions(labelGroupOptions)
            setSelectedOption({label: labelGroupName, value: uid + '-' + projectName + '-' + labelGroupName})
            setDeleteButtonDisabled(false)
            selectedLabelGroupName.current = labelGroupName
            selectedLabelGroupValue.current = uid + '-' + projectName + '-' + labelGroupName
        }
        else {
            console.log('Error, no label defined')
        }
    }

    // --------------------------------------
    // Get the list of available label groups
    // --------------------------------------
    async function getLabelGroups() {
        const response = await gateway.lookoutEquipment.listLabelGroups(uid + '-' + projectName + '-')

        let labelGroupOptions = [{label: 'No label', value: 'NoLabel'}]
        if (response['LabelGroupSummaries'].length > 0) {
            response['LabelGroupSummaries'].forEach((labelGroup) => {
                let label = labelGroup['LabelGroupName']
                label = label.split('-').slice(2).join('-')
                labelGroupOptions.push({'label': label, 'value': labelGroup['LabelGroupName']})
            })    
        }

        return labelGroupOptions
    }

    // --------------------------------------------------------------------------------
    // This functions collects all the labels associated with the selected label groups
    // --------------------------------------------------------------------------------
    async function getLabels(selectedLabelGroup) {
        setSelectedOption(selectedLabelGroup)
        let currentLabelGroupName = selectedLabelGroup['value']
        selectedLabelGroupValue.current = selectedLabelGroup['value']

        if (currentLabelGroupName === 'NoLabel') {
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
                        start: Math.floor((label['StartTime'] - startTime)/totalRange * x.length), 
                        end: Math.floor((label['EndTime'] - startTime)/totalRange * x.length)
                    })
                })

                setDeleteButtonDisabled(false)
                labels.current = currentRanges
            }

            selectedLabelGroupValue.current = currentLabelGroupName
            currentLabelGroupName = currentLabelGroupName.substring(uid.length + 1 + projectName.length + 1, currentLabelGroupName.length)
            setLabelGroupName(currentLabelGroupName)
            selectedLabelGroupName.current = currentLabelGroupName
        }

        labelsTableRef.current.updateTable(labels.current)
        redrawBrushes()
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
        const labelGroupOptions = await getLabelGroups()
        setGroupLabelOptions(labelGroupOptions)

        // Select the "NoLabel" option and clear the rest of the UI:
        setSelectedOption({label: 'No label', value: 'NoLabel'})
        labels.current = []
        setLabelGroupName("")
        selectedLabelGroupName.current = ""
        selectedLabelGroupValue.current = undefined
        setDeleteButtonDisabled(true)
        labelsTableRef.current.updateTable(labels.current)
        redrawBrushes()
        setShowDeleteLabelGroupModal(false)
    }

    // -------------------------------------------------------
    // Called when clearing the selection: this action removes
    // all the labels from the plots and the table below
    // -------------------------------------------------------
    const onClear = (e) => {
        if (e['command'] && e['command'] === 'clear') {
            labels.current = []
            eChartRef.current.getEchartsInstance().dispatchAction({
                type: 'brush',
                areas: []
            })
            labelsTableRef.current.updateTable(labels.current)
        }
    }

    // ------------------------------------------------------
    // Once the data is loaded, we can display the component:
    // ------------------------------------------------------
    if (!data.timeseries) {
        return (
            <Alert header="Data preparation in progress">
                Data preparation and ingestion in the app still in progress: after uploading your
                dataset, the app prepares it to optimize visualization speed. This step usually 
                takes 10 to 20 minutes depending on the size of the dataset you uploaded.
            </Alert>
        )
    }
    else if (data) {
        const legendWidth = getLegendWidth(tagsList)

        const option = buildChartOptions(
            tagsList, 
            signals, 
            x,              // xTickLabels
            0,              // initialZoomStart
            100,            // initialZoomEnd
            true,           // showLegend, 
            true,           // showToolbox, 
            legendWidth,
            true,           // enableBrush
            false,          // customDatazoomColor
            readOnly,        //readOnly
            5               // showTopN
        )

        useEffect(() => {
            getLabelGroups()
            .then((x) => setGroupLabelOptions(x))
        }, [])

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
                    {/***************************************************************
                     * This section is only displayed when the component is read only 
                     ***************************************************************/ }
                    {readOnly && <FormField label="Select labels (optional)" description="You can load a group of labels previously defined using the following drop down:">
                        <Select
                            selectedOption={selectedOption}
                            onChange={({ detail }) => { getLabels(detail.selectedOption) }}
                            options={groupLabelOptions}
                            placeholder="Select an existing group to load the associated labels"
                        />
                    </FormField> }

                    { readOnly && labels.current && labels.current.length > 0 && <FormField 
                        label="Signal overview" 
                        description="Use the following plot to preview the selected labels on your actual signals"
                        stretch={true}
                    >
                        <ReactEcharts 
                            option={option}
                            theme="macarons"
                            style={{ height: componentHeight, width: "100%" }}
                            ref={eChartRef}
                            onEvents={{
                                'brushEnd': onBrushEndEvent
                            }}
                            onChartReady={() => { redrawBrushes() }}
                        />
                    </FormField> }

                    {/*******************************************************************
                     * This section is only displayed when the component is NOT read only 
                     *******************************************************************/ }
                    {!readOnly && <FormField 
                            label="Select an existing group of labels to edit them" 
                            description="You
                            can also load a group of labels previously defined using the drop down:"
                            secondaryControl={
                                <Button disabled={deleteButtonDisabled} 
                                        onClick={() => { setShowDeleteLabelGroupModal(true) }}>
                                    Delete group
                                </Button>
                            }
                    >
                        <Select
                            selectedOption={selectedOption}
                            onChange={({ detail }) => { getLabels(detail.selectedOption) }}
                            options={groupLabelOptions}
                            placeholder="Select an existing group to load the associated labels"
                        />
                    </FormField> }

                    { !readOnly && <FormField 
                        label="Signal overview" 
                        description="Use the following plot to preview the selected labels on your actual signals. Use the
                                     labels selection control (red icons) on the top right of the plot below to select time
                                     ranges that will be used as labels for your model"
                        stretch={true}
                    >
                        <ReactEcharts 
                            option={option}
                            theme="macarons"
                            style={{ height: componentHeight, width: "100%" }}
                            ref={eChartRef}
                            onEvents={{
                                'brushEnd': onBrushEndEvent,
                                'brush': onClear
                            }}
                            onChartReady={() => { redrawBrushes() }}
                        />
                    </FormField> }

                    {/***********************************************************************************
                     * This section is always displayed whether the component is in read only mode or not
                     ***********************************************************************************/ }
                    <Box>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <Form>
                                <SpaceBetween size="xl">
                                    <LabelsTable ref={labelsTableRef} x={x} labels={labels.current} />

                                    { !readOnly && <>
                                        <FormField
                                            description="Give a name to your label group"
                                            label="Label group name"
                                            secondaryControl={
                                                <SpaceBetween size="s" direction="horizontal">
                                                    <Button variant="primary" onClick={(e) => createLabelGroup(e)}>Create group</Button>
                                                    {/* <Button>Update group</Button> */}
                                                </SpaceBetween>
                                            }
                                        >
                                            <Input 
                                                onChange={({ detail }) => setLabelGroupName(detail.value)}
                                                value={labelGroupName}
                                                placeholder="Enter a label group name"
                                            />
                                        </FormField>
                                    </> }
                                </SpaceBetween>
                            </Form>
                        </form>
                    </Box>
                </SpaceBetween>
            </>
        )
    }
}

export default LabelsManagement