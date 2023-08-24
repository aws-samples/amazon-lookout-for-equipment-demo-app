export function buildChartOptions(items, sensorName, zoomStart, zoomEnd) {
    // Building the data to feed the time series: x will contain the 
    // x-axis tick labels and y the values taken by the signal over time:
    let x = []
    let y = []
    items.forEach((item) => {
        let current_date = new Date(item['timestamp']['S']).getTime()
        current_date = current_date - new Date().getTimezoneOffset()*30*1000
        current_date = new Date(current_date).toISOString().substring(0, 19).replace('T', '\n');
        x.push(current_date)
        y.push(parseFloat(item[sensorName]['S']))
    })

    // Configure the series to be plotted with echart:
    const series = [{
        name: sensorName,
        symbol: 'none',
        sampling: 'lttb',
        data: y,
        type: 'line',
        color: 'rgb(141, 152, 179)',
        emphasis: { disabled: true }
    }]

    // echart options:
    const chartOptions = {
        xAxis: { type: 'category', data: x },
        yAxis: { type: 'value' },
        series: series,
        animation: false,
        dataZoom: [{ start: zoomStart, end: zoomEnd, type: 'slider'}],
        grid: {top: 35, bottom: 90, left: 50, right: 10},
        brush: {
            toolbox: ['lineX', 'clear'],
            xAxisIndex: 0,
            brushMode: "single",
            brushStyle: {
                color: 'rgba(151, 181, 82, 0.2)',
                borderColor: 'rgba(151, 181, 82, 0.7)'
            }
        }
    }

    return chartOptions
}