// Imports:
import { useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

// Application components:
import { getProjectDetails, getSamplingRate, getClosestSamplingRate } from '../projectDashboard/projectDashboardUtils'
import CreateDefaultModel from './CreateDefaultModel'

// CloudScape components:
import Alert                from "@cloudscape-design/components/alert"
import Box                  from "@cloudscape-design/components/box"
import Button               from "@cloudscape-design/components/button"
import ColumnLayout         from "@cloudscape-design/components/column-layout"
import SpaceBetween         from "@cloudscape-design/components/space-between"
import Spinner              from "@cloudscape-design/components/spinner"
import Textarea             from "@cloudscape-design/components/textarea"
import TextContent          from "@cloudscape-design/components/text-content"

// Contexts
import ModelParametersContext from '../contexts/ModelParametersContext'
import ApiGatewayContext from '../contexts/ApiGatewayContext'
import TimeSeriesContext from '../contexts/TimeSeriesContext'

// Utils:
import { getAvailableDefaultModelName } from '../../utils/utils'

const samplingRateTable = {
    1: ['1 second', 'PT1S'],
    10: ['10 seconds', 'PT10S'],
    15: ['15 seconds', 'PT15S'],
    30: ['30 seconds', 'PT30S'],
    60: ['1 minute', 'PT1M']
}

function DefaultModelConfig() {
    const { modelName, defaultModelConfig } = useContext(ModelParametersContext)
    const { data, tagsList } = useContext(TimeSeriesContext)
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { projectName } = useParams()
    const errorMessage = useRef("")
    const modelSummaryRef = useRef(null)
    const showModelSummary = useRef(false)
    const [ modelDetails, setModelDetails ] = useState(undefined)
    const [ calculatedSR, setCalculatedSR ] = useState(undefined)

    useEffect(() => {
        getAvailableDefaultModelName(gateway, uid, projectName)
        .then((x) => modelName.current = x)
    }, [gateway])

    useEffect(() => {
        getProjectDetails(gateway, uid, projectName)
        .then(({ projectDetails }) => { 
            setModelDetails(projectDetails)
            setCalculatedSR(
                getClosestSamplingRate(
                    getSamplingRate(
                        projectDetails['rowCounts'],
                        projectDetails['startDate'],
                        projectDetails['endDate']
                    )
                )
            )
        })
    }, [gateway, projectName])

    if (calculatedSR) {
        let trainingStartDate = new Date(data.startDate).getTime()
        let trainingEndDate = new Date(data.endDate).getTime()
        let evaluationStartDate = ""
        let evaluationEndDate = ""    
        const totalNumDays = parseInt((trainingEndDate - trainingStartDate) / 1000 / 86400)
        if (totalNumDays < 91) {
            errorMessage.current = (<>You need at least <b>90 days</b> of to train a model: only <b>{totalNumDays} days</b> available.</>)
        }
        else {
            trainingStartDate = data.startDate
            trainingEndDate = new Date(new Date(data.startDate).getTime() + 91 * 86400 * 1000).toISOString().replace('T', ' ').substring(0, 19)
            evaluationStartDate = new Date(new Date(data.startDate).getTime() + 91 * 86401 * 1000).toISOString().replace('T', ' ').substring(0, 19)
            evaluationEndDate = new Date(new Date(data.startDate).getTime() + (91 + 180) * 86401 * 1000)
            evaluationEndDate = Math.min(new Date(data.endDate), evaluationEndDate)
            evaluationEndDate = new Date(evaluationEndDate).toISOString().replace('T', ' ').substring(0, 19)
        }

        // Build the schema based on the signals selected:
        let schema = {
            Components: [{
                ComponentName: projectName,
                Columns: [
                    { Name: "timestamp", Type: "DATETIME" }
                ]
            }]
        }

        tagsList.forEach((signal) => {
            schema['Components'][0]['Columns'].push({
                Name: signal,
                Type: "DOUBLE"
            })
        })

        defaultModelConfig.current = {
            modelName: projectName + '-' + modelName.current,
            datasetName: `l4e-demo-app-${uid}-${projectName}`,
            projectName: projectName,
            trainingStartDate: parseInt(new Date(trainingStartDate).getTime() / 1000),
            trainingEndDate: parseInt(new Date(trainingEndDate).getTime() / 1000),
            evaluationStartDate: parseInt(new Date(evaluationStartDate).getTime() / 1000),
            evaluationEndDate: parseInt(new Date(evaluationEndDate).getTime()) / 1000,
            samplingRate: samplingRateTable[calculatedSR][1],
            schema: schema
        }

        const toggleModelSummary = (e) => {
            e.preventDefault()
            showModelSummary.current = !showModelSummary.current
            modelSummaryRef.current.showModal(showModelSummary.current)
        }

        const dismissModelSummary = () => {
            showModelSummary.current = false
        }

        // Renders the component:
        return (
            <SpaceBetween size="xxs">
                <Box>
                    The following parameters have been defined automatically for your dataset. Click <b>Create model</b> to create a new model
                    after you've reviewed these parameters.
                    <Box float="right">
                        <Button 
                            variant="primary" 
                            onClick={toggleModelSummary}
                            disabled={errorMessage.current !== ""}
                        >
                            Create model
                        </Button>
                    </Box>
                </Box>
                <ColumnLayout columns={2} variant="text-grid">
                    <SpaceBetween size="l">
                        <div>
                            <Box variant="awsui-key-label">Model name</Box>
                            <div>{modelName.current}</div>
                        </div>

                        { errorMessage.current !== "" && <Alert type="error">{errorMessage.current}</Alert> }

                        { errorMessage.current === "" && <>
                            <div>
                                <Box variant="awsui-key-label">Training range</Box>
                                <TextContent><p>
                                    From {trainingStartDate} to {trainingEndDate}<br />
                                    <i>(Total duration: {parseInt((new Date(trainingEndDate).getTime() - new Date(trainingStartDate).getTime()) / 1000 / 86400)} days)</i>
                                </p></TextContent>
                            </div>

                            <div>
                                <Box variant="awsui-key-label">Evaluation range</Box>
                                <TextContent><p>
                                    From {evaluationStartDate} to {evaluationEndDate}<br />
                                    <i>(Total duration: {parseInt((new Date(evaluationEndDate).getTime() - new Date(evaluationStartDate).getTime()) / 1000 / 86400)} days)</i>
                                </p></TextContent>
                            </div>
                        </> }

                        <div>
                            <Box variant="awsui-key-label">Suggested sampling rate</Box>
                            {modelDetails && <>
                                <div>{samplingRateTable[calculatedSR][0]}</div>
                                <div>
                                    <i>Note: the average sampling rate from your dataset is:&nbsp;
                                    {getSamplingRate(
                                        modelDetails['rowCounts'],
                                        modelDetails['startDate'],
                                        modelDetails['endDate']
                                    )} seconds</i>
                                </div>
                            </>}
                        </div>
                    </SpaceBetween>

                    <div>
                        <Box variant="awsui-key-label">Signals list</Box>
                        <Textarea
                            value={tagsList.join('\n')}
                            readOnly={true}
                            rows={12}
                        />
                    </div>
                </ColumnLayout>

                <CreateDefaultModel ref={modelSummaryRef} dismissFunction={dismissModelSummary} modelConfig={defaultModelConfig.current} />
            </SpaceBetween>
        )
    }
    else {
        return (
            <Spinner />
        )
    }
}

export default DefaultModelConfig