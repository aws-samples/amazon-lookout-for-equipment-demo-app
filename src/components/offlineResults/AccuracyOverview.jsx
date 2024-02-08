// Imports:
import { useContext, useState } from 'react'
import ReactEcharts from 'echarts-for-react'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import "../../styles/chartThemeMacarons.js"

// CloudScape components:
import Alert            from "@cloudscape-design/components/alert"
import Box              from "@cloudscape-design/components/box"
import ColumnLayout     from "@cloudscape-design/components/column-layout"
import Container        from "@cloudscape-design/components/container"
import SpaceBetween     from "@cloudscape-design/components/space-between"

// Contexts:
import OfflineResultsContext from '../contexts/OfflineResultsContext'
import { getTrainingMarkAreaSeries } from './offlineResultsUtils'
import { 
    classify, 
    getEventwiseAnomalies, 
    buildAnomaliesSeries, 
    buildLabelsSeries 
} from './accuracyUtils.js'

function AccuracyOverview() {
    const { modelDetails } = useContext(OfflineResultsContext)
    const [ mergeThreshold, setMergeThreshold ] = useState(1)
    const [ earlyWarningThreshold, setEarlyWarningThreshold ] = useState(1)

    if (modelDetails && modelDetails['labels']) {
        const anomalies = modelDetails.anomalies.Items
        const evaluationStart = new Date(modelDetails.evaluationStart)

        let { events, labels, stats } = classify(
            getEventwiseAnomalies(anomalies, mergeThreshold), 
            modelDetails['labels'],
            evaluationStart,
            earlyWarningThreshold
        )

        const { truePositiveSeries, falsePositiveSeries } = buildAnomaliesSeries(events)
        const { detectedLabelsSeries, undetectedLabelsSeries } = buildLabelsSeries(
            labels, 
            new Date(modelDetails['trainingStart'])
        )

        let options = {
            title: [{text: 'Accuracy overview'}],
            grid: [{ tooltip: { show: true } }],
            xAxis: [{ type: 'time', gridIndex: 0, minorTick: { show: true }}],
            yAxis: [{ 
                show: false, 
                gridIndex: 0, 
                min: 0.0, 
                max: 1.1,
                axisPointer: { show: false }
            }],
            series: [
                truePositiveSeries,
                falsePositiveSeries,
                detectedLabelsSeries, 
                undetectedLabelsSeries,
                getTrainingMarkAreaSeries(0, evaluationStart)    // Training range
            ],
            tooltip: { 
                show: true, 
                axisPointer: { type: 'cross', axis: 'auto' },
            },
            graphic: {
                type: 'group',
                children: [
                    {
                        type: 'text',
                        left: 0, top: 68, z: 100,
                        style: {
                            text: 'Detected events',
                            font: 'bold 14px Amazon Ember'
                        }
                    },
                    {
                        type: 'text',
                        left: 0, top: 105, z: 100,
                        style: {
                            text: 'Known labels',
                            font: 'bold 14px Amazon Ember'
                        }
                    }
                ]
            },
            dataZoom: { type:'slider', start: 0, end: 100, showDataShadow: false },
            animation: false,
        }

        return (
            <Container>
                <ColumnLayout columns={3} variant="text-grid">
                    <SpaceBetween size="l">
                        <div>
                            <Box variant="awsui-key-label">Known historical events</Box>
                            <div>{labels.length} label{labels.length > 1 ? 's' : ''} defined</div>
                        </div>
                        <div>
                            <Box variant="awsui-key-label">Detected events</Box>
                            <div>{events.length} anomalous event{events.length > 1 ? 's' : ''} identified</div>
                        </div>
                    </SpaceBetween>

                    <SpaceBetween size="l">
                        <div>
                            Group detected events together if they are less than <b>{mergeThreshold} hour
                            {mergeThreshold > 1 ? 's' : ''}</b> apart:

                            <Slider 
                                min={0} max={24} step={1} defaultValue={mergeThreshold} 
                                onChange={(value) => { setMergeThreshold(value)}}
                            />
                        </div>
                        <div>
                            Consider a detected event as a relevant early warning if it happened 
                            less than <b>{earlyWarningThreshold} hour{earlyWarningThreshold > 1 ? 's' : ''}</b> before
                            a known label:

                            <Slider 
                                min={0} max={168} step={1} defaultValue={earlyWarningThreshold} 
                                onChange={(value) => { setEarlyWarningThreshold(value)}}
                            />
                        </div>
                    </SpaceBetween>

                    <SpaceBetween size="l">
                        <div>
                            <Box variant="awsui-key-label">Correct detections</Box>
                            <div>
                                Amongst the labels present in the evaluation range, <br />
                                <b>{stats.detected} / {stats.numLabels}</b> labels were correctly 
                                detected <b>({(stats.detected / stats.numLabels * 100).toFixed(0)}%)</b>.
                            </div>
                        </div>
                        <div>
                            <Box variant="awsui-key-label">Relevant events</Box>
                            <div>
                                <b>{stats.truePositives} / {events.length}</b> relevant anomalies detected.
                            </div>
                            <div>
                                (<b>{(100 - (stats.truePositives / events.length * 100)).toFixed(0)}</b>% false positives)
                            </div>
                        </div>
                    </SpaceBetween>
                </ColumnLayout>

                <ReactEcharts 
                    option={options}
                    // notMerge={true}
                    theme="macarons"
                    style={{height: 200, width: "100%"}}
                />
            </Container>
        )
    }
    else {
        return <Alert>
            To evaluate the accuracy of a model, you compare known historical incidents
            with the events detected by Lookout for Equipment. To enable this evaluation,
            you need to create some labels in the Labeling section and then train a model
            using these labels.
        </Alert>
    }
}

export default AccuracyOverview