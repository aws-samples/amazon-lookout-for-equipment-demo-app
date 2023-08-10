export function buildTimeseries(items, field, fieldType) {
    let x = []
    let y = []
    let sum = 0
    if (!fieldType) { fieldType = 'S' }

    items.forEach((item) => {
        let currentDate = new Date(parseInt(item['timestamp']['N'])*1000)
        currentDate = new Date(currentDate).toISOString().substring(0, 19).replace('T', '\n');
        x.push(currentDate)
        y.push(parseFloat(item[field][fieldType]))
        sum += parseFloat(item[field][fieldType])
    })

    return {x, y, sum}
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
            currentDate = new Date(currentDate).toISOString().substring(0, 19).replace('T', '\n');
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
    signals, 
    xTickLabels, 
    initialZoomStart, 
    initialZoomEnd, 
    showLegend, 
    showToolbox, 
    legendWidth,
    enableBrush,
    customDatazoomColor,
    readOnly
) {
    const series = []
    tagsList.forEach((tag) => {
        series.push({
            name: tag,
            symbol: 'none',
            sampling: 'lttb',
            data: signals[tag],
            type: 'line',
            emphasis: {
                disabled: false,
                focus: "self"
            }
        })
    })

    const datazoomOption = { 
        start: initialZoomStart, 
        end: initialZoomEnd, 
        top: 40, 
        type: 'slider'
    }

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
        xAxis: { type: 'category', data: xTickLabels },
        yAxis: { type: 'value' },
        series: series,
        animation: false,
        dataZoom: [datazoomOption],
        grid: { top: 90, bottom: 30 },
        toolbox: {
            right: 110,
            top: 0
        }
    }

    if (showLegend) {
        option['legend'] = {
            type: 'scroll',
            orient: 'vertical',
            textStyle: { fontSize: 10 },
            icon: "circle",
            right: 0,
            top: 40,
            selector: [
                { type: 'all', title: 'All' },
                { type: 'inverse', title: 'Inverse' }
            ],
            data: tagsList
        }
        option['grid'] = { top: 95, left: 50, bottom: 30, right: legendWidth }
        option['toolbox'] = {
            right: legendWidth,
            top: 0
        }
    }

    if (enableBrush && !readOnly) {
        option['brush'] = {
            toolbox: ['lineX', 'keep', 'clear'],
            xAxisIndex: 0,
            brushMode: 'multiple',
            brushStyle: {
                color: 'rgba(151, 181, 82, 0.2)',
                borderColor: 'rgba(151, 181, 82, 0.7)'
            }
        }
    }
    else if (enableBrush && readOnly) {
        option['brush'] = {
            toolbox: ['keep'],
            xAxisIndex: 0,
            brushMode: 'multiple',
            transformable: false,
            brushStyle: {
                color: 'rgba(151, 181, 82, 0.2)',
                borderColor: 'rgba(151, 181, 82, 0.7)'
            }
        }
        option['toolbox'] = { show: false }
        datazoomOption['top'] = 10
        option['grid']['top'] = 65
        option['legend']['top'] = 10
    }

    return option
}