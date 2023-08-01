// Imports
import { useRef, useContext, useState, useEffect } from 'react'
import ReactEcharts from "echarts-for-react"

// Application components:
import LabelsTable from "./LabelsTable"

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Form         from "@cloudscape-design/components/form"
import FormField    from '@cloudscape-design/components/form-field'
import Input        from "@cloudscape-design/components/input"
import Modal        from "@cloudscape-design/components/modal"
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
function LabelsManagement({ componentHeight }) {
    const { data, tagsList, x, signals } = useContext(TimeSeriesContext)
    const { trainingRange, labels, totalLabelDuration, datasetName, selectedLabelGroupName, selectedLabelGroupValue } = useContext(ModelParametersContext)
    const { gateway, uid } = useContext(ApiGatewayContext)
    const labelsTableRef = useRef(undefined)
    const eChartRef = useRef(null)
    const [ labelGroupName, setLabelGroupName ] = useState(!selectedLabelGroupName.current ? "" : selectedLabelGroupName.current)
    const [ groupLabelOptions, setGroupLabelOptions ] = useState([{label: 'No label', value: 'NoLabel'}])
    const [ selectedOption, setSelectedOption] = useState(
        !selectedLabelGroupName.current ? undefined : {label: selectedLabelGroupName.current, value: selectedLabelGroupValue.current}
    )
    const [ deleteButtonDisabled, setDeleteButtonDisabled] = useState(!selectedLabelGroupName.current ? true : false)
    const [ showDeleteLabelGroupModal, setShowDeleteLabelGroupModal] = useState(false)

    if (!componentHeight) { componentHeight = 350 }

    // --------------------------------------------------------
    // When the user changes the data zoom range, we update the
    // training and evaluation range. This must be in sync with
    // the data ranges date pickers
    // --------------------------------------------------------
    const onDataZoomEnd = (e) => {
        if (e['type'] && e['type'] == 'datazoom') {
            // initialZoomStart.current = e['start']
            // initialZoomEnd.current = e['end']
            // updateRanges()
            // modelDataRangesRef.current.forceUpdate()
        }
    }

    // ----------------------------------------------------------
    // Compute the total duration of the labels located in the
    // training range. L4E must have at least 90 days of training
    // data available. This will help show the users when they
    // are below this treshold:
    // ----------------------------------------------------------
    function updateLabelDuration(currentLabels) {
        let totalDuration = 0

        if (currentLabels && currentLabels.length > 0) {    
            const trainingEndDate = new Date(trainingRange.current.endDate)
    
            currentLabels.forEach((label) => {
                let labelEndDate = new Date(x[label['end']])
                if (trainingEndDate < labelEndDate) {
                    labelEndDate = trainingEndDate
                }
                const duration = labelEndDate - new Date(x[label['start']])
    
                totalDuration += duration
            })
    
            totalLabelDuration.current = totalDuration
        }
    }

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
        updateLabelDuration(labels.current)
        labelsTableRef.current.updateTable(labels.current)
        // modelDataRangesRef.current.forceUpdate()
    }

    // --------------------------------------------------------------
    // This removes all the labels from the plots and the table below
    // --------------------------------------------------------------
    const clearLabels = (e) => {
        e.preventDefault()

        labels.current = []
        updateLabelDuration(labels.current)
        eChartRef.current.getEchartsInstance().dispatchAction({
            type: 'brush',
            areas: []
        })
        labelsTableRef.current.updateTable(labels.current)
        // modelDataRangesRef.current.forceUpdate()
    }

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

    // ---------------------------------------------------------
    // This function is triggered when the chart is finished 
    // rendering. If some labels where highlighted using eCharts 
    // brushes, then we recreate them.
    // ---------------------------------------------------------
    const onChartReady = (e) => {
        redrawBrushes()
    }

    const createLabelGroup = async (e) => {
        e.preventDefault()

        if (labels.current.length > 0) {
            const labelGroupRequest = {
                LabelGroupName: uid + '-' + datasetName.current + '-' + labelGroupName,
                Tags: [{ 'Key': 'ProjectName', 'Value': datasetName.current }]
            }

            await gateway.lookoutEquipment.createLabelGroup(labelGroupRequest)
                .then((response) => { console.log(response) })
                .catch((error) => { console.log(error.response) })

            labels.current.forEach(async (label) => {
                const labelRequest = {
                    LabelGroupName: uid + '-' + datasetName.current + '-' + labelGroupName,
                    StartTime: new Date(x[label['start']]).getTime() / 1000,
                    EndTime: new Date(x[label['end']]).getTime() / 1000,
                    Rating: 'ANOMALY'
                }

                await gateway.lookoutEquipment.createLabel(labelRequest)
                    .then((response) => { console.log(response) })
                    .catch((error) => { console.log(error.response) })
            })

            const labelGroupOptions = await getLabelGroups()
            setGroupLabelOptions(labelGroupOptions)
        }
        else {
            console.log('Error, no label defined')
        }
    }

    async function getLabelGroups() {
        const response = await gateway.lookoutEquipment.listLabelGroups(uid + '-' + datasetName.current + '-')

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
            currentLabelGroupName = currentLabelGroupName.substring(uid.length + 1 + datasetName.current.length + 1, currentLabelGroupName.length)
            setLabelGroupName(currentLabelGroupName)
            selectedLabelGroupName.current = currentLabelGroupName
        }

        updateLabelDuration(labels.current)
        labelsTableRef.current.updateTable(labels.current)
        redrawBrushes()
    }

    async function deleteLabelGroup() {
        const labelGroupName = selectedOption['value']
        await gateway.lookoutEquipment.deleteLabelGroup(labelGroupName)
        const labelGroupOptions = await getLabelGroups()
        setGroupLabelOptions(labelGroupOptions)
    }

    const onDeleteInit = () => { setShowDeleteLabelGroupModal(true) }
    const onDeleteDiscard = () => { setShowDeleteLabelGroupModal(false) }
    const onDeleteConfirm = async () => { 
        await deleteLabelGroup()
        setShowDeleteLabelGroupModal(false) 
    }

    function DeleteLabelGroupModal({ visible, onDiscard, onDelete }) {
        return (
            <Modal 
                visible={visible} 
                onDismiss={onDiscard} 
                header="Delete label group"
                footer={
                    <Box float="right">
                        <SpaceBetween direction="horizontal" size="xs">
                            <Button variant="link" onClick={onDiscard}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={onDelete}>
                                Delete
                            </Button>
                        </SpaceBetween>
                    </Box>
                  }
            >
                <Box variant="span">Permanently delete this label group? You can't undo this action.</Box>
            </Modal>
        )
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
            x, 
            0,
            100,
            true, // showLegend, 
            false, // showToolbox, 
            legendWidth,
            true, // enableBrush
            false // customDatazoomColor
        )

        useEffect(() => {
            getLabelGroups()
            .then((x) => setGroupLabelOptions(x))
        }, [])

        return (
            <>
                <DeleteLabelGroupModal visible={showDeleteLabelGroupModal} onDiscard={onDeleteDiscard} onDelete={onDeleteConfirm} />
                <SpaceBetween size="xl">
                    <FormField>
                        <SpaceBetween size="l">
                            <Box>
                                Use the labels selection control on the top right of the plot below
                                to select time ranges that will be used as labels for your model. You
                                can also load a group of labels previously defined using the drop down:
                            </Box>

                            <SpaceBetween size="xl" direction="horizontal">
                                <Select
                                    selectedOption={selectedOption}
                                    onChange={({ detail }) => { getLabels(detail.selectedOption) }}
                                    options={groupLabelOptions}
                                    placeholder="Select an existing group to load the associated labels"
                                />

                                <Box float="right">
                                    <SpaceBetween direction="horizontal" size="xs">
                                        <Button disabled={deleteButtonDisabled} onClick={onDeleteInit}> Delete label group</Button>
                                        <Button variant="link" onClick={clearLabels}>Clear labels</Button>
                                    </SpaceBetween>
                                </Box>
                            </SpaceBetween>
                        </SpaceBetween>
                    </FormField>

                    <ReactEcharts 
                        option={option}
                        theme="macarons"
                        style={{ height: componentHeight, width: "100%" }}
                        ref={eChartRef}
                        onEvents={{
                            'datazoom': onDataZoomEnd, 
                            'brushEnd': onBrushEndEvent
                        }}
                        onChartReady={onChartReady}
                    />

                    <Box>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <Form>
                                <SpaceBetween size="xl">
                                    <LabelsTable ref={labelsTableRef} x={x} labels={labels.current} clearLabels={clearLabels} />

                                    <FormField
                                        description="You can save a group of labels that will be linked to your dataset"
                                        label="Label group name"
                                    >
                                        <Input 
                                            onChange={({ detail }) => setLabelGroupName(detail.value)}
                                            value={labelGroupName}
                                            placeholder="Enter a label group name"
                                        />
                                    </FormField>

                                    <Box>
                                        <SpaceBetween size="s" direction="horizontal">
                                            <Button variant="primary" onClick={(e) => createLabelGroup(e)}>Create new label group</Button>
                                            <Button>Update label group</Button>
                                        </SpaceBetween>
                                    </Box>
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