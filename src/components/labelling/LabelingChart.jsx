// Imports
import { useCallback, useContext } from 'react'
import ReactEcharts from "echarts-for-react"

// Cloudscape components:
import FormField from '@cloudscape-design/components/form-field'
import Link      from "@cloudscape-design/components/link"

// Contexts:
import ModelParametersContext from '../contexts/ModelParametersContext'
import HelpPanelContext       from '../contexts/HelpPanelContext'
import LabelingContext        from '../contexts/LabelingContext'

function LabelingChart({ chartLabel, chartDescription, componentHeight, redrawBrushes, onBrushEndEvent, onClear, interactive }) {
    const { setHelpPanelOpen } = useContext(HelpPanelContext)
    const { option, eChartRef, labelsTableRef, storedRanges, trainingStart, trainingEnd } = useContext(LabelingContext)
    const { labels } = useContext(ModelParametersContext)

    return (
        <FormField 
            label={chartLabel} 
            description={chartDescription}
            info={
                <Link variant="info" onFollow={() => setHelpPanelOpen({
                    status: true,
                    page: 'labelling',
                    section: 'signalOverview'
                })}>Info</Link>
            }
            stretch={true}>

            { interactive && 
                <ReactEcharts 
                    option={option}
                    theme="macarons"
                    style={{ height: componentHeight, width: "100%" }}
                    ref={eChartRef}
                    onEvents={{
                        'brushEnd': useCallback((e) => { onBrushEndEvent(e, labels, labelsTableRef, storedRanges, eChartRef) }, [labels]),
                        'brush': useCallback((e) => {
                            onClear(e, eChartRef, labels, storedRanges)
                            if (e['command'] && e['command'] === 'clear') {
                                if (labelsTableRef && labelsTableRef.current) {
                                    labelsTableRef.current.updateTable([])
                                }
                            }
                        }, [labels])
                    }}
                    onChartReady={(e) => { redrawBrushes(eChartRef, labels) }}
                />
            }

            { !interactive && 
                <ReactEcharts 
                    option={option}
                    theme="macarons"
                    style={{ height: componentHeight, width: "100%" }}
                    ref={eChartRef}
                    onChartReady={(e) => { redrawBrushes(eChartRef, labels) }}
                />
            }

        </FormField>
    )
}

export default LabelingChart