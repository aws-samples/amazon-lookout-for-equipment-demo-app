import ReactEcharts from "echarts-for-react"
import { histogram } from 'echarts-stat'
import Spinner from "@cloudscape-design/components/spinner"

function TimeSeriesHistograms({ 
    data, 
    ranges, 
    sensorName, 
    width, 
    height, 
    hideTitle, 
    gridOptions, 
    hideAnimation, 
    colors, 
    legend, 
    selectedTitle, 
    unselectedTitle 
}) {
    if (data) {
        let values = []
        let selectedValues = []
        data.timeseries.Items.forEach((item, index) => {
            if (ranges && ranges[0] && index >= ranges[0]["start"] && index <= ranges[0]["end"]) {
                selectedValues.push(parseFloat(item[sensorName]['S']))
            }
            else {
                // console.log(item)
                values.push(parseFloat(item[sensorName]['S']))
            }
        })

        const bins = histogram(values)
        let series = [{
            name: selectedTitle ? selectedTitle : 'Values distribution',
            type: 'bar',
            barWidth: 8,
            data: bins.data,
        }]

        if (selectedValues.length > 0) {
            const selectedBins = histogram(selectedValues)
            series.push({
                name: unselectedTitle ? unselectedTitle : 'Selected values distribution',
                type: 'bar',
                barWidth: 8,
                data: selectedBins ? selectedBins.data : [],
            })
        }

        const options = {
            title: { 
                left: 'center',
                text: hideTitle ? '' : 'Signal value distribution', 
                textStyle: { fontSize: 16, fontWeight: 'bold', color: '#000' }
            },
            color: colors ? colors : ['rgb(0, 183, 0, 0.5)', 'rgb(183, 0, 0, 0.5)'],
            xAxis: { scale: true },
            yAxis: {},
            grid: {top: 30, bottom: 25, left: 50, right: 10},
            series: series
        }

        if (gridOptions) { options['grid'] = gridOptions }
        if (hideAnimation) { options['animation'] = false }
        if (legend) { options['legend'] = legend }

        return (
            <div>
                <ReactEcharts 
                    option={options}
                    theme="macarons"
                    style={{
                        height: height ? height : 300,
                        width: width ? width : 650
                    }}
                />
            </div>
        )
    }
    else {
        return (
            <Spinner />
        )
    }
}

export default TimeSeriesHistograms