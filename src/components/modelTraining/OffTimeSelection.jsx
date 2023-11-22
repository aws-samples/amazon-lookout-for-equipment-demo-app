// Imports:
import { useContext, useRef } from 'react'
import ReactEcharts from "echarts-for-react"
import { graphic } from 'echarts'
import "../../styles/chartThemeMacarons.js"

// Cloudscape components:
import Alert        from '@cloudscape-design/components/alert'
import Box          from '@cloudscape-design/components/box'
import FormField    from '@cloudscape-design/components/form-field'
import Input        from '@cloudscape-design/components/input'
import Link         from '@cloudscape-design/components/link'
import Select       from '@cloudscape-design/components/select'
import SpaceBetween from '@cloudscape-design/components/space-between'

// Contexts
import TimeSeriesContext from '../contexts/TimeSeriesContext'
import ModelParametersContext from '../contexts/ModelParametersContext'
import HelpPanelContext from '../contexts/HelpPanelContext'

function buildChartOptions(
    tag, 
    timeseries, 
    conditionOption, 
    conditionValue, 
    eChartRef, 
    onConditionValueDragEnd, 
    setOfftimeMin, 
    setOfftimeMax,
    timeseriesData
) {
    if (!tag) { return undefined }

    let y = []
    timeseries.forEach((item) => {
        y.push(parseFloat(item[tag]['S']))
    })

    const yMin = Math.min(...y)
    const yMax = Math.max(...y)

    // let conditionY = Array.apply(0.0, Array(y.length)).map(() => yMin)
    // let conditionY = Array.apply(0.0, Array(timeseriesData[tag].length)).map((element, index) => [element[0], yMin])
    let conditionY = timeseriesData[tag].map((element, index) => [element[0], yMin])
    let currentConditionValue = conditionValue
    if (currentConditionValue < yMin) { currentConditionValue = yMin }
    if (currentConditionValue > yMax) { currentConditionValue = yMax }
    setOfftimeMin(yMin)
    setOfftimeMax(yMax)

    let indexes = []
    let offsetStart = 0
    let offsetEnd = 1
    if (conditionOption.value === ">") {
        indexes = y.map((element,index) => element >= conditionValue ? index : undefined).filter(x => x)
        offsetStart = 0
        offsetEnd = 1
    }
    else {
        indexes = y.map((element,index) => element <= conditionValue ? index : undefined).filter(x => x)
        offsetStart = 1
        offsetEnd = 0
    }

    indexes.map((element) => { conditionY[element] = [timeseriesData[tag][element][0], yMax * 1.1] })

    let chartOptions = {
        // xAxis: { type: 'category', data: x },
        xAxis: { type: 'time' },
        yAxis: { 
            type: 'value', 
            min: 'dataMin',
            max: 'dataMax',
            axisLabel: { formatter: (value) => { 
                if (yMax > 10) { return value.toFixed(0) }
                else if (yMax > 1) { return value.toFixed(1) }
                else { return value.toFixed(2) }
            }},
        },
        series: [
            {
                name: tag,
                symbol: 'none',
                sampling: 'lttb',
                data: timeseriesData[tag],
                type: 'line',
                color: 'rgb(141, 152, 179)',
                emphasis: { disabled: true }
            },
            {
                symbol: 'none',
                data: conditionY,
                type: 'line',
                lineStyle: { width: 0 },
                emphasis: { disabled: true },
                areaStyle: {
                    opacity: 0.2,
                    origin: 'start',
                    color: new graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: offsetStart, color: 'rgb(192, 80, 80)' },
                        { offset: offsetEnd, color: 'rgb(192, 80, 80)' }
                    ])
                },
            }
        ],
        animation: false,
        dataZoom: [{ start: 0, end: 100, type: 'slider'}],
        grid: {id: 'offSignalId', top: 10, bottom: 90, left: 50, right: 20},
        tooltip: {
            show: true,
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: '#6a7985'
                }
            }
        }
    }

    if (eChartRef && eChartRef.current) {
        const chart = eChartRef.current.getEchartsInstance()

        chartOptions['graphic'] = getDraggableLineConfig(
            chart,                                                  // eChartInstance
            timeseriesData[tag][0][0],                              // x1
            timeseriesData[tag][timeseriesData[tag].length - 1][0], // x2
            currentConditionValue,                                  // y,
            onConditionValueDragEnd
        )
    }

    return chartOptions
}

function getDraggableLineConfig(chart, x1, x2, y, onDragEvent) {
    return {
        $action: 'replace',
        type: 'line',
        cursor: 'grab',
        shape: {
            x1: chart.convertToPixel({'gridId': 'offSignalId'}, [x1, y])[0], 
            y1: chart.convertToPixel({'gridId': 'offSignalId'}, [x1, y])[1], 
            x2: chart.convertToPixel({'gridId': 'offSignalId'}, [x2, y])[0], 
            y2: chart.convertToPixel({'gridId': 'offSignalId'}, [x2, y])[1]
        },
        draggable: 'vertical',
        style: {
            stroke: 'rgb(192, 80, 80)',
            lineWidth: 2.0,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            shadowBlur: 3
        },
        z: 100,
        ondrag: (e) => onDragEvent(e)
    }
}

// --------------------------
// Component main entry point
// --------------------------
function OffTimeSelection() {
    const { data, x, timeseriesData } = useContext(TimeSeriesContext)
    const { setHelpPanelOpen } = useContext(HelpPanelContext)
    const { 
        selectedItems,
        selectedOption,
        selectedSignal,
        offConditionValue,
        offtimeMin,
        offtimeMax,
        setSelectedOption,
        setSelectedSignal,
        setOffConditionValue,
        setOfftimeMin,
        setOfftimeMax
    } = useContext(ModelParametersContext)
    const eChartRef = useRef(null)

    let signalsList = [{label: 'No off time detection', value: undefined}]
    if (selectedItems.length > 0) {
        let signals = []
        selectedItems.forEach((signal) => { signals.push(signal['name']) })
        signals.sort()
        signals.forEach((signal) => {
            signalsList.push({ label: signal, value: signal })
        })
    }

    const onConditionValueDragEnd = (e) => {
        const chart = eChartRef.current.getEchartsInstance()
        const targetCoordinates = chart.convertFromPixel('grid', [0, e.offsetY])
        if (targetCoordinates[1] < offtimeMin) {
            setOffConditionValue(offtimeMin)

            chart.setOption({
                graphic: getDraggableLineConfig(
                    chart,                      // eChartInstance
                    x[0],                       // x1
                    x[x.length - 1],            // x2
                    offtimeMin,                 // y
                    onConditionValueDragEnd
                )
            })
        }
        else if (targetCoordinates[1] > offtimeMax) {
            setOffConditionValue(offtimeMax)

            chart.setOption({
                graphic: getDraggableLineConfig(
                    chart,                      // eChartInstance
                    x[0],                       // x1
                    x[x.length - 1],            // x2
                    offtimeMax,                 // y
                    onConditionValueDragEnd
                )
            })
        }
        else {
            setOffConditionValue(targetCoordinates[1])
        }
    }

    const onChartReady = (e) => {
        if (eChartRef && eChartRef.current) {
            const chart = eChartRef.current.getEchartsInstance()

            chart.setOption({
                graphic: getDraggableLineConfig(
                    chart,                      // eChartInstance
                    x[0],                       // x1
                    x[x.length - 1],            // x2
                    offConditionValue,          // y
                    onConditionValueDragEnd
                )
            })
        }
    }

    let chartOptions = undefined
    if (selectedSignal && selectedSignal['value']) {
        chartOptions = buildChartOptions(
            selectedSignal['value'], 
            data.timeseries.Items,
            selectedOption,
            offConditionValue,
            eChartRef,
            onConditionValueDragEnd,
            setOfftimeMin,
            setOfftimeMax,
            timeseriesData
        )
    }

    // Rendering the component
    return (
        <SpaceBetween size="xl">
            <FormField 
                label="Off time detection"
                description={<>You configure off-time detection by choosing one of the sensor selected in the <b>Signal selection</b> tab that is representative of your process' or machine's on/off state.</>}
                info={ 
                    <Link variant="info" onFollow={() => setHelpPanelOpen({
                        status: true,
                        page: 'modelTraining',
                        section: 'wizardOffTimeDetection'
                    })}>Info</Link>
                }
            >
                <SpaceBetween size="xl" direction="horizontal">
                    <Select
                        selectedOption={selectedSignal}
                        onChange={({ detail }) => { 
                            setSelectedSignal(detail.selectedOption)
                            setOffConditionValue(0.0)
                        }}
                        options={signalsList}
                        filteringType="auto"
                    />

                    <Select
                        selectedOption={selectedOption}
                        onChange={({ detail }) => { setSelectedOption(detail.selectedOption) }}
                        options={[
                            { label: "Lesser or equal than", value: "<" },
                            { label: "Greater or equal than", value: ">" }
                        ]}
                        disabled={!selectedSignal.value}
                    />

                    <Input
                        onChange={({ detail }) => { setOffConditionValue(detail.value) }}
                        value={offConditionValue}
                        disabled={!selectedSignal.value}
                    />
                </SpaceBetween>
            </FormField>

            { chartOptions && <Box>
                <ReactEcharts 
                    option={chartOptions}
                    theme="macarons"
                    ref={eChartRef}
                    onChartReady={onChartReady}
                />
            </Box> }

            { !chartOptions && <Alert>
                Select a signal in the off time detection drop down to visualize the corresponding signal and the desired threshold.
            </Alert> }

            {/* {chart} */}
        </SpaceBetween>
    )
}

export default OffTimeSelection