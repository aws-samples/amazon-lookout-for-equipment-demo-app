// Imports:
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

// Cloudscape components:
import Alert        from '@cloudscape-design/components/alert'
import Box          from "@cloudscape-design/components/box"
import Container    from '@cloudscape-design/components/container'
import Header       from '@cloudscape-design/components/header'
import SpaceBetween from "@cloudscape-design/components/space-between"
import Spinner      from '@cloudscape-design/components/spinner'

// Utils:
import { getModelDetails } from '../../utils/dataExtraction'
import { cleanList, binarySearchBins, getHumanReadableTime } from '../../utils/utils'
import Refresh from '../shared/Refresh'

// Contexts:
import ApiGatewayContext from './ApiGatewayContext'
const OfflineResultsContext = createContext()

// ========================================
// Offline results data provider definition
// ========================================
export const OfflineResultsProvider = ({ children }) => {
    const { projectName, modelName } = useParams()
    const { gateway, uid } = useContext(ApiGatewayContext)

    const [ modelDetails, setModelDetails ] = useState(undefined)
    const [ tagsList, setTagsList ] = useState(undefined)
    const [ trainingTimeseries, setTrainingTimeseries ] = useState(undefined)
    const [ evaluationTimeseries, setEvaluationTimeseries ] = useState(undefined)
    const [ anomaliesTimeseries, setAnomaliesTimeseries ] = useState(undefined)
    const [ sensorContributionTimeseries, setSensorContributionTimeseries ] = useState(undefined)
    const [ histogramData, setHistogramData ] = useState(undefined)
    const [ deleteInProgress, setDeleteInProgress ] = useState(false)
    const [ loading, setLoading ] = useState(true)

    // Refresh component state definition:
    const [ refreshTimer, setRefreshTimer] = useState(Date.now())
    const refreshStartTime  = useRef(Date.now())
    const progressBar = useRef('.')

    // ------------------------
    // Loads the model details:
    // ------------------------
    useEffect(() => {
        setLoading(true)
        getModelDetails(gateway, modelName, projectName, uid, deleteInProgress)
        .then((details) => { 
            if (details) {
                // Loading the overall model details:
                setModelDetails(details)

                if (details['status'] === 'SUCCESS') {
                    // Building and cleaning the tags list:
                    let tagsList = details['tagsList']
                    const tagsToRemove = ['asset', 'sampling_rate', 'timestamp', 'unix_timestamp']
                    tagsList = cleanList(tagsToRemove, tagsList)
                    setTagsList(tagsList)

                    // Building training time series for each tag present in the dataset:
                    const {trainingTimeseries, trainingHistogram} = buildTrainingTimeseries(
                        details.timeseries.Items,
                        tagsList,
                        new Date(details.trainingStart),
                        new Date(details.trainingEnd)
                    )
                    setTrainingTimeseries(trainingTimeseries)

                    // Building training and evaluation time series for each tag:
                    const { 
                        evaluationTimeseries, 
                        anomaliesTimeseries,
                        evaluationHistogram,
                        anomaliesHistogram
                    } = buildEvaluationTimeSeries(
                        details.timeseries.Items,
                        tagsList,
                        new Date(details.evaluationStart),
                        new Date(details.evaluationEnd),
                        details.events
                    )
                    setEvaluationTimeseries(evaluationTimeseries)
                    setAnomaliesTimeseries(anomaliesTimeseries)

                    // Build the sensor contribution time series for each tag:
                    let sensorContributionTimeseries = undefined
                    if (details.sensorContribution && details.sensorContribution.Items) {
                        sensorContributionTimeseries = buildSensorContributionTimeseries(
                            details.sensorContribution.Items,
                            tagsList
                        )
                    }
                    setSensorContributionTimeseries(sensorContributionTimeseries)

                    // Build the histogram data:
                    setHistogramData({
                        training: trainingHistogram,
                        evaluation: evaluationHistogram,
                        anomalies: anomaliesHistogram
                    })
                }

                setLoading(false)
            }
        })
    }, [gateway, modelName, projectName, refreshTimer])

    // --------------------------------------
    // Renders the provider and its children:
    // --------------------------------------
    if ((!loading && modelDetails && modelDetails['status'] === 'IN_PROGRESS')) {
        const now = new Date()
        const tzOffset = new Date(modelDetails['createdAt']).getTimezoneOffset() * 60 * 1000

        return (
            <Container header={<Header variant="h1">Model overview</Header>}>
                <Alert>
                    <SpaceBetween size="l">
                        <Box>
                            Model training in progress since <b>{modelDetails['createdAt']} UTC</b>.<br />
                            Training time: <b>{getHumanReadableTime(now.getTime() - new Date(modelDetails['createdAt']) + tzOffset)}</b>.
                        </Box>

                        <Refresh 
                            refreshTimer={setRefreshTimer} 
                            refreshInterval={30} 
                            refreshStartTime={refreshStartTime.current} 
                            progressBar={progressBar}
                        />
                    </SpaceBetween>
                </Alert>
            </Container>
        )
    }
    else if (!loading && modelDetails && modelDetails['status'] !== 'IN_PROGRESS') {
        return (
            <OfflineResultsContext.Provider value={{
                modelDetails,
                tagsList,
                trainingTimeseries,
                evaluationTimeseries,
                anomaliesTimeseries,
                sensorContributionTimeseries,
                histogramData,
                deleteInProgress,
                
                setDeleteInProgress
            }}>
                {children}
            </OfflineResultsContext.Provider>
        )
    }
    else {
        return (
            <Container header={<Header variant="h1">Model overview</Header>}>
                <Spinner />
            </Container>
        )
    }
}

// --------------------------------------------------------------
// Extracts the training range time series and the histogram data
// --------------------------------------------------------------
function buildTrainingTimeseries(timeseries, tagsList, start, end) {
    let data = {}
    let dataHistograms = {}

    // Prepare the raw time series data:
    timeseries.forEach((item) => {
        const x = new Date(item.unix_timestamp.N * 1000)
        if (x >= start && x <= end) {
            tagsList.forEach((tag) => {
                const y = parseFloat(item[tag].S)
                if (!data[tag]) { 
                    data[tag] = [] 
                    dataHistograms[tag] = []
                }
                data[tag].push([x, y])
                dataHistograms[tag].push(y)
            })
        }
    })

    return {
        trainingTimeseries: data,
        trainingHistogram: dataHistograms
    }
}

// ---------------------------------------------------------
// Extracts the evaluation range time series, the anomalies
// and the associated histogram data to these two categories
// ---------------------------------------------------------
function buildEvaluationTimeSeries(timeseries, tagsList, start, end, events) {
    let data = {}
    let dataAnomalies = {}
    let anomaly = false
    let evaluationHistogram = {}
    let anomaliesHistogram = {}

    // Prepare the raw time series data:
    timeseries.forEach((item) => {
        const x = new Date(item.unix_timestamp.N * 1000)
        binarySearchBins(events, x) >= 0 ? anomaly = true : anomaly = false

        if (x >= start && x <= end) {
            tagsList.forEach((tag) => {
                if (!data[tag]) { 
                    data[tag] = []
                    dataAnomalies[tag] = [] 
                    evaluationHistogram[tag] = []
                    anomaliesHistogram[tag] = []
                }

                const y = parseFloat(item[tag].S)
                data[tag].push([x, y])
                evaluationHistogram[tag].push(y)
                if (anomaly) {
                    dataAnomalies[tag].push([x, y])
                    anomaliesHistogram[tag].push(y)
                }
            })
        }
    })

    return {
        evaluationTimeseries: data,
        anomaliesTimeseries: dataAnomalies,
        evaluationHistogram: evaluationHistogram,
        anomaliesHistogram: anomaliesHistogram
    }
}

// --------------------------------------------
// Extracts the sensor contribution time series
// --------------------------------------------
function buildSensorContributionTimeseries(sensorContribution, tagsList) {
    let dataContribution = {}

    // Prepare the sensor contribution as a time series:
    sensorContribution.forEach((item, index) => {
        const x = new Date(item.timestamp.N * 1000)

        tagsList.forEach((tag) => {
            const y = parseFloat(item[tag].S)
            if (!dataContribution[tag]) { dataContribution[tag] = []}
            dataContribution[tag].push([x, y])    
        })
    })

    return dataContribution
}

export default OfflineResultsContext