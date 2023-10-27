// Imports
import { useContext, useState } from 'react'
import { useParams } from 'react-router-dom'

// Application components:
import LabelsTable           from "./LabelsTable"
import DeleteLabelGroupModal from "./DeleteLabelGroupModal"
import UpdateLabelGroupModal from "./UpdateLabelGroupModal"
import LabelGroupSelect      from "./LabelGroupSelect"
import LabelingChart         from "./LabelingChart"

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
import Button       from "@cloudscape-design/components/button"
import Container    from "@cloudscape-design/components/container"
import Flashbar     from "@cloudscape-design/components/flashbar"
import FormField    from '@cloudscape-design/components/form-field'
import Input        from "@cloudscape-design/components/input"
import Link         from "@cloudscape-design/components/link"
import ProgressBar  from "@cloudscape-design/components/progress-bar"
import SpaceBetween from "@cloudscape-design/components/space-between"

// Contexts:
import TimeSeriesContext      from '../contexts/TimeSeriesContext'
import ModelParametersContext from '../contexts/ModelParametersContext'
import ApiGatewayContext      from '../contexts/ApiGatewayContext'
import HelpPanelContext       from '../contexts/HelpPanelContext'
import LabelingContext        from '../contexts/LabelingContext'

// Utils:
import "../../styles/chartThemeMacarons.js"
import { redrawBrushes, onBrushEndEvent, onClear, getLabelGroups } from './labelingUtils.js'

function LabelsManagement({ componentHeight, readOnly }) {
    // Load context variables:
    const { 
        showDeleteLabelGroupModal,
        showUpdateLabelGroupModal,
        selectedOption,
        emptyGroupName,
        groupLabelOptions,
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

        getLabels,
        checkLabelGroupNameErrors
    } = useContext(LabelingContext)

    const { 
        labels, 
        selectedLabelGroupName, 
        selectedLabelGroupValue 
    } = useContext(ModelParametersContext)
    const { data } = useContext(TimeSeriesContext)
    const { gateway, uid, showHelp } = useContext(ApiGatewayContext)
    const { setHelpPanelOpen } = useContext(HelpPanelContext)
    const { projectName } = useParams()

    // Define component state:
    const [ labelGroupName, setLabelGroupName ]                       = useState(!selectedLabelGroupName.current ? "" : selectedLabelGroupName.current)
    const [ errorMessage, setErrorMessage ]                           = useState("")
    const [ invalidName, setInvalidName ]                             = useState(false)
    const [ noLabelDefined, setNoLabelDefined ]                       = useState(false)
    const [ showUserGuide, setShowUserGuide ]                         = useState(true)
    const [ showUpdateSuccess, setShowUpdateSuccess ]                 = useState(false)
    const [ flashbarItems, setFlashbarItems ]                         = useState([])
    const [ labelUpdateProgress, setLabelUpdateProgress ]             = useState(0)
    const [ updateProgressBarVisible, setUpdateProgressBarVisible ]   = useState(false)

    if (!componentHeight) { componentHeight = 350 }

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
        const modelTrainingLink = <Link 
            href={`/model-training/ProjectName/${projectName}`}
            onFollow={(e) => { 
                e.preventDefault()
                navigate(`/model-training/ProjectName/${projectName}`)
            }}>Model training</Link>

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
            let { error } = await checkLabelGroupErrors(labelGroupName, projectName)

            if (!error) {
                const labelGroupRequest = {
                    LabelGroupName: uid + '-' + projectName + '-' + labelGroupName,
                    Tags: [{ 'Key': 'ProjectName', 'Value': projectName }]
                }

                await gateway.lookoutEquipment.createLabelGroup(labelGroupRequest)
                    .catch((err) => { 
                        console.log(err.response) 
                        error = true
                        if (err.response.data.__type === 'com.amazonaws.thorbrain#ServiceQuotaExceededException') {
                            setErrorMessage(`Limit exceeded for "max number of label groups". Please contact
                                             your administrator to request a limit increase for this account.`)
                        }
                        else {
                            setErrorMessage(err.response.data.Message)
                        }
                    })

                if (!error) {
                    setProgressBarVisible(true)
                    let index = 0
                    for (const label of labels.current) {
                        const labelRequest = {
                            LabelGroupName: uid + '-' + projectName + '-' + labelGroupName,
                            StartTime: new Date(label['start']).getTime() / 1000,
                            EndTime: new Date(label['end']).getTime() / 1000,
                            Rating: 'ANOMALY'
                        }

                        await gateway.lookoutEquipment.createLabel(labelRequest)
                            .catch((error) => { console.log(error.response) })

                        // Wait 200-400 ms to prevent label creation throttling:
                        const timeout = 200 + Math.floor(Math.random() * 200)
                        await new Promise(r => setTimeout(r, timeout))

                        index += 1
                        setLabelCreationProgress(Math.floor(index / labels.current.length * 100))
                    }

                    const labelGroupOptions = await getLabelGroups(gateway, uid, projectName)
                    setGroupLabelOptions(labelGroupOptions)
                    setSelectedOption({label: labelGroupName, value: uid + '-' + projectName + '-' + labelGroupName})
                    setDeleteButtonDisabled(false)
                    setUpdateButtonDisabled(false)
                    setProgressBarVisible(false)
                    selectedLabelGroupName.current = labelGroupName
                    selectedLabelGroupValue.current = uid + '-' + projectName + '-' + labelGroupName
                }
            }
        }

        // ----------------------------------------------------------------
        // This function updates an existing label group. We delete all the
        // labels from the current label group and recreate all of them
        // ----------------------------------------------------------------
        const updateLabelGroup = async (e) => {
            // First we delete all the existing labels from this label group:
            setLabelUpdateProgress(0)
            setUpdateProgressBarVisible(true)
            deleteAllLabels()

            // Then we loop through all the latest labels defined by the user
            // and we attach them to the current label group:
            // labels.current.forEach(async (label) => {
            let index = 0
            for (const label of labels.current) {
                const labelRequest = {
                    LabelGroupName: selectedLabelGroupValue.current,
                    StartTime: new Date(label['start']).getTime() / 1000,
                    EndTime: new Date(label['end']).getTime() / 1000,
                    Rating: 'ANOMALY'
                }

                await gateway.lookoutEquipment
                             .createLabel(labelRequest)
                             .catch((error) => { console.log(error.response) })

                // Wait 100-300 ms to prevent label creation throttling:
                const timeout = 200 + Math.floor(Math.random() * 200)
                await new Promise(r => setTimeout(r, timeout))

                index += 1
                setLabelUpdateProgress(Math.floor(index / labels.current.length * 100))
            }

            // Dismiss the dialog box:
            setShowUpdateLabelGroupModal(false)
            setShowUpdateSuccess(true)
            setUpdateProgressBarVisible(false)
            setLabelUpdateProgress(100)
            setFlashbarItems([{
                type: "success",
                content: `Label group ${selectedLabelGroupValue.current.slice(uid.length + 1 + projectName.length + 1)} was updated`,
                dismissible: true,
                dismissLabel: "Dismiss message",
                onDismiss: () => setFlashbarItems([])
            }])
        }

        // --------------------------------------------------------------
        // This functions deletes all the labels from a given label group
        // --------------------------------------------------------------
        async function deleteAllLabels() {
            const response = await gateway.lookoutEquipment
                                    .listLabels(selectedLabelGroupValue.current)
                                    .catch((error) => console.log(error.response))

            if (response['LabelSummaries'].length > 0) {
                response['LabelSummaries'].forEach(async (label) => {
                    await gateway.lookoutEquipment
                                 .deleteLabel(selectedLabelGroupValue.current, label.LabelId)
                                 .catch((error) => console.log(error.response))

                    // Wait to prevent label deletion throttling:
                    await new Promise(r => setTimeout(r, 300))
                })
            }

            setLabelCreationProgress(0)
            setProgressBarVisible(false)
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
            storedRanges.current = []
            setLabelGroupName("")
            setDeleteButtonDisabled(true)
            setUpdateButtonDisabled(true)
            labelsTableRef.current.updateTable(labels.current)
            redrawBrushes(eChartRef, labels)
            setShowDeleteLabelGroupModal(false)

            setFlashbarItems([{
                type: "success",
                content: `Label group ${selectedLabelGroupValue.current.slice(uid.length + 1 + projectName.length + 1)} was successfully deleted`,
                dismissible: true,
                dismissLabel: "Dismiss message",
                onDismiss: () => setFlashbarItems([])
            }])

            selectedLabelGroupName.current = ""
            selectedLabelGroupValue.current = undefined
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

                <UpdateLabelGroupModal 
                    visible={showUpdateLabelGroupModal} 
                    onDiscard={() => { setShowUpdateLabelGroupModal(false) }} 
                    onUpdate={async () => { await updateLabelGroup() }}
                    selectedLabelGroup={selectedOption ? selectedOption['value'].slice(uid.length + projectName.length + 2) : ""}
                    internalLabelGroupName={selectedOption ? selectedOption['value'] : ""}
                    labelUpdateProgress={labelUpdateProgress}
                    updateProgressBarVisible={updateProgressBarVisible}
                />

                <SpaceBetween size="xl">
                    <Flashbar items={flashbarItems} />

                    { errorMessage !== "" && <Alert type="error">{errorMessage}</Alert> }

                    { !readOnly && showHelp && showUserGuide && <Container>
                        <Alert dismissible={true} onDismiss={() => setShowUserGuide(false)}>
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
                        </Alert> 
                    </Container> }

                    {/***************************************************************
                     * This section is only displayed when the component is read only 
                     ***************************************************************/ }
                    { readOnly && <Container>
                        <LabelGroupSelect
                            formLabel="Select a label group (optional)"
                            formDescription="You can load a group of labels previously defined using the following drop down."
                            showSecondaryControl={false}
                            getLabels={getLabels} 
                            setLabelGroupName={setLabelGroupName} />
                    </Container> }

                    { readOnly && <Container>
                        <LabelingChart 
                            chartLabel="Signal overview"
                            chartDescription="Use the following plot to preview the selected labels on your actual signals"
                            componentHeight={componentHeight} 
                            redrawBrushes={redrawBrushes}
                            interactive={false}
                        />
                    </Container> }

                    {/*******************************************************************
                     * This section is only displayed when the component is NOT read only 
                     *******************************************************************/ }
                    { !readOnly && groupLabelOptions.length > 1 && <Container>
                        <LabelGroupSelect
                            formLabel="Select an existing label group"
                            formDescription="Using this drop down, you can load a group of labels previously 
                                             defined to visualize them over your time series."
                            showSecondaryControl={true}
                            getLabels={getLabels} 
                            setLabelGroupName={setLabelGroupName} />
                    </Container> }

                    { !readOnly && <Container>
                        <LabelingChart 
                            chartLabel="Signal overview"
                            chartDescription="Use the following plot to preview the selected labels on your actual signals. Use the
                                              labels selection control (red icons) on the top right of the plot below to select time
                                              ranges that will be used as labels for your model"
                            componentHeight={componentHeight} 
                            interactive={true}
                            redrawBrushes={redrawBrushes}
                            onBrushEndEvent={onBrushEndEvent}
                            onClear={onClear}
                        />
                    </Container> }

                    {/***********************************************************************************
                     * This section is always displayed whether the component is in read only mode or not
                     ***********************************************************************************/ }
                    <FormField stretch={true}>
                        <LabelsTable 
                            ref={labelsTableRef} 
                            labels={labels} 
                            storedRanges={storedRanges}
                            noLabelDefined={noLabelDefined} 
                            redrawBrushes={redrawBrushes} 
                            eChartRef={eChartRef} 
                            labelsTableRef={labelsTableRef}
                            readOnly={readOnly}
                        />
                    </FormField>

                    {/*******************************************************************
                     * This section is only displayed when the component is NOT read only 
                     *******************************************************************/ }
                    { selectedOption.value === "NewGroup" && !readOnly && <Container>
                        <SpaceBetween size="xl">
                            <FormField
                                description={`After you've selected some labels in the plot above, you can give a name 
                                            to your label group and save it. Note that you can't modify a label group
                                            once created.`}
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
                            </FormField> 

                            { progressBarVisible && <FormField>
                                <ProgressBar
                                    value={labelCreationProgress}
                                    label="Creating labels"
                                />
                            </FormField> }
                        </SpaceBetween>
                    </Container> }
                </SpaceBetween>
            </>
        )
    }
}

export default LabelsManagement