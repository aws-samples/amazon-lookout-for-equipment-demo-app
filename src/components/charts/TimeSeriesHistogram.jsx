// Imports:
import ReactEcharts from "echarts-for-react"
import { histogram } from 'echarts-stat'
import Spinner from "@cloudscape-design/components/spinner"

// ---------------------
// Component entry point
// ---------------------
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
    // If we actually have some data to show, we display it, otherwise we will show a Spinner:
    if (data) {
        // We loops through all the items and sort them depending on 
        // whether they fall within the use selected range or not: each
        // set of values will be displayed as an histogram:
        let values = []
        let selectedValues = []
        data.timeseries.Items.forEach((item, index) => {
            if (ranges && ranges[0] && index >= ranges[0]["start"] && index <= ranges[0]["end"]) {
                selectedValues.push(parseFloat(item[sensorName]['S']))
            }
            else {
                values.push(parseFloat(item[sensorName]['S']))
            }
        })

        // First histograms, the normal values outside of the user selection:
        const bins = histogram(values)
        let series = [{
            name: selectedTitle ? selectedTitle : 'Values distribution',
            type: 'bar',
            barWidth: 8,
            data: bins.data,
        }]

        // Second histogram if we have a selection:
        if (selectedValues.length > 0) {
            const selectedBins = histogram(selectedValues)
            series.push({
                name: unselectedTitle ? unselectedTitle : 'Selected values distribution',
                type: 'bar',
                barWidth: 8,
                data: selectedBins ? selectedBins.data : [],
            })
        }

        // Build the eChart options:
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

        // Add some options (grid, animation or legend):
        if (gridOptions) { options['grid'] = gridOptions }
        if (hideAnimation) { options['animation'] = false }
        if (legend) { options['legend'] = legend }

        // Plot the component:
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

    // No data to show yet, displaying a spinner in the meantime:
    else {
        return (
            <Spinner />
        )
    }
}

export default TimeSeriesHistograms