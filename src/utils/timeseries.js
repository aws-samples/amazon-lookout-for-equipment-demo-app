export function buildTimeseries(items, field, fieldType, daily) {
    let x = []
    let y = []
    let sum = 0
    if (!fieldType) { fieldType = 'S' }

    items.forEach((item) => {
        let currentDate = new Date(parseInt(item['timestamp']['N'])*1000)
        if (daily) {
            currentDate = new Date(currentDate).toISOString().substring(0, 10)
        }
        else {
            currentDate = new Date(currentDate).toISOString().substring(0, 19).replace('T', '\n')
        }
        x.push(currentDate)
        y.push(parseFloat(item[field][fieldType]))
        sum += parseFloat(item[field][fieldType])
    })

    return {x, y, sum}
}

export function buildTimeseries2(items, field, fieldType, timestampField) {
    let data = []
    let sum = 0
    let yMin = undefined
    let yMax = undefined
    if (!fieldType) { fieldType = 'S' }
    if (!timestampField) { timestampField = 'timestamp'}

    items.forEach((item) => {
        const x = new Date(parseInt(item[timestampField]['N'])*1000)
        const y = parseFloat(item[field][fieldType])
        data.push([x, y])

        if (!yMin) { yMin = y}
        if (!yMax) { yMax = y}
        if (y < yMin) { yMin = y}
        if (y > yMax) { yMax = y}
        sum += y
    })

    return {data, sum, yMin, yMax}
}

export function extractTimeseriesPart(items, field, startDate, endDate) {
    let x = []
    let y = []
    let sum = 0
    let maxIndex = 0

    items.forEach((item, index) => {
        maxIndex = index
        let currentDate = parseInt(item['timestamp']['N']) * 1000

        if (currentDate >= startDate * 1000 && currentDate <= endDate * 1000) {
            currentDate = new Date(currentDate).toISOString().substring(0, 19).replace('T', '\n')
            x.push(currentDate)
            y.push(parseFloat(item[field]['S']))

            sum += parseFloat(item[field]['S'])
        }
    })

    return {x, y, sum}
}

export function getZoomStart(items, dateStart) {
    let zoomStart = undefined

    items.forEach((item, index) => {
        let currentDate = new Date(parseInt(item['timestamp']['N'])*1000)

        if (!zoomStart && currentDate > dateStart) {
            zoomStart = Math.round(index / items.length * 100)
        }
    })

    return zoomStart
}

export function getEvaluationStartIndex(items, dateStart) {
    let evaluationStart = undefined

    items.forEach((item, index) => {
        let currentDate = new Date(parseInt(item['unix_timestamp']['N'])*1000)

        if (!evaluationStart && currentDate > dateStart) {
            evaluationStart = index
        }
    })

    return evaluationStart
}

export function buildChartOptions(
    tagsList, 
    timeseriesData,
    initialZoomStart, 
    initialZoomEnd, 
    showLegend, 
    showToolbox, 
    legendWidth,
    enableBrush,
    customDatazoomColor,
    readOnly,
    showTopN,
    frozenMarkers,
    showLabels,
    existingMarkers,
    markAreaStart,
    markAreaEnd,
    markAreaLabel,
) {
    const series = []

    if (markAreaStart && markAreaEnd) {
        series.push({
            symbol: 'none',
            data: [],
            type: 'line',
            xAxisIndex: 0,
            markArea: {
                itemStyle: {  
                    color: 'rgb(151, 181, 82, 0.15)',
                    borderColor: 'rgb(151, 181, 82, 0.8)',
                    borderWidth: 1.0,
                    borderType: 'dashed'
                },
                data: [[{name: markAreaLabel, xAxis: markAreaStart}, {xAxis: markAreaEnd}]],
                lineStyle: { width: 0 },
            },
        })
    }

    tagsList.forEach((tag) => {
        series.push({
            name: tag,
            symbol: 'none',
            sampling: 'lttb',
            data: timeseriesData[tag],
            type: 'line',
            xAxisIndex: 0,
            emphasis: {
                disabled: false,
                focus: "self"
            },
            tooltip: { valueFormatter: (value) => value.toFixed(2) },
        })
    })

    let top = 0
    if (showToolbox) {
        top = 40
    }

    const datazoomOption = [
        { 
            start: initialZoomStart, 
            end: initialZoomEnd, 
            top: top,
            left: 60,
            right: legendWidth,
            xAxisIndex: 0,
            type: 'slider'
        },
        { 
            left: 0,
            yAxisIndex: 0,
            type: 'slider',
            showDetail: false,
            showDataShadow: false,
            width: 15,
        }
    ]

    if (customDatazoomColor) {
        datazoomOption['dataBackground'] = { 
            areaStyle: {color: 'rgb(141, 152, 179)', opacity: 0.2},
            lineStyle: {color: 'rgb(141, 152, 179)'}
        }
        datazoomOption['selectedDataBackground'] = { 
            areaStyle: {color: 'rgb(151, 181, 82)', opacity: 0.4},
            lineStyle: {color: 'rgb(151, 181, 82)'}
        }
    }

    let option = {
        xAxis: { type: 'time', minorTick: { show: true } },
        yAxis: { type: 'value' },
        series: series,
        animation: false,
        dataZoom: datazoomOption,
        grid: { top: 55 + top, bottom: 30, right: 0, left: 70 },
        toolbox: {
            right: 110,
            top: 0
        },
        tooltip: { show: true, trigger: 'axis' }
    }

    if (showLegend) {
        option['legend'] = {
            type: 'scroll',
            orient: 'vertical',
            textStyle: { fontSize: 10 },
            icon: "circle",
            right: 0,
            top: top,
            selector: [
                { type: 'all', title: 'All' },
                { type: 'inverse', title: 'Inverse' }
            ],
            data: tagsList
        }
        option['grid'] = { top: 55 + top, left: 70, bottom: 30, right: legendWidth }
        option['toolbox'] = {
            right: legendWidth,
            top: 0
        }

        if (showTopN) {
            option['legend']['selected'] = {}
            tagsList.forEach((tag, index) => {
                if (index < showTopN) {
                    option['legend']['selected'][tag] = true
                }
                else {
                    option['legend']['selected'][tag] = false
                }
            })
        }
    }

    if (enableBrush && !readOnly) {
        option['brush'] = {
            toolbox: ['lineX', 'keep', 'clear'],
            xAxisIndex: 'all',
            brushMode: 'multiple',
            brushStyle: {
                color: 'rgba(151, 181, 82, 0.2)',
                borderColor: 'rgba(151, 181, 82, 1.0)',
                borderWidth: 1.0
            }
        }

        if (frozenMarkers) {
            option['brush']['transformable'] = false
            option['toolbox']['show'] = false
        }
        else {
            option['brush']['transformable'] = true
            option['toolbox']['show'] = true
        }
    }
    else if (showLabels || (enableBrush && readOnly)) {
        option['brush'] = {
            toolbox: ['keep'],
            xAxisIndex: 'all',
            brushMode: 'multiple',
            transformable: false,
            brushStyle: {
                color: 'rgba(151, 181, 82, 0.2)',
                borderColor: 'rgba(151, 181, 82, 0.7)'
            },
        }
        option['toolbox']['show'] = false
        datazoomOption['top'] = 10
        option['grid']['top'] = 55 + top
        option['legend']['top'] = 10
    }

    return option
}