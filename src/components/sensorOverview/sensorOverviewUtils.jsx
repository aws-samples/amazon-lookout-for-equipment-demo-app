import CategoricalFlag from '../shared/CategoricalFlag'
import { getSignalDetails } from '../../utils/dataExtraction'

// -------------------------
// Plot a signal time series
// -------------------------
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

// -------------------------------------------------------------------------------------
// Builds the columns and items to be displayed in the signal grading table of this page
// -------------------------------------------------------------------------------------
export async function buildTableItems(gateway, projectName) {
    const signalDetails = await getSignalDetails(gateway, projectName)

    let tableItems = []

    // Defining columns for the table:
    const tableColumns = [
        {id: "SensorName", header: "Sensor", cell: e => e.SensorName, sortingField: 'SensorName'},
        {id: "DataStartTime", header: "Start time", cell: e => e.DataStartTime, sortingField: 'DataStartTime'},
        {id: "DataEndTime", header: "End time", cell: e => e.DataEndTime, sortingField: 'DataEndTime'},
        {id: "Categorical", header: "Categorical?", cell: e => (<CategoricalFlag type={e.Categorical} />), sortingField: 'Categorical'},
        {id: "LargeGaps", header: "Large gaps?", cell: e => (<CategoricalFlag type={e.LargeGaps} />), sortingField: 'LargeGaps'},
        {id: "Monotonic", header: "Monotonic?", cell: e => (<CategoricalFlag type={e.Monotonic} />), sortingField: 'Monotonic'},
        {id: "MultipleModes", header: "Multiple modes?", cell: e => (<CategoricalFlag type={e.MultipleModes} />), sortingField: 'MultipleModes'},
        {id: "DuplicateTimestamps", header: "Duplicates", cell: e => e.DuplicateTimestamps, sortingField: 'DuplicateTimestamps'},
        {id: "InvalidDateEntries", header: "Invalid timestamps", cell: e => e.InvalidDateEntries, sortingField: 'InvalidDateEntries'},
        {id: "InvalidValues", header: "Invalid values", cell: e => e.InvalidValues, sortingField: 'InvalidValues'},
        {id: "MissingValues", header: "Missing values", cell: e => e.MissingValues, sortingField: 'MissingValues'},
    ]

    // Populating the content for the table:
    signalDetails['sensorStatistics'].forEach((stat) => {
        const current_item = {
            SensorName: stat['SensorName'],
            DataStartTime: new Date(stat['DataStartTime']*1000).toISOString().replace('T', ' ').substring(0,19),
            DataEndTime: new Date(stat['DataEndTime']*1000).toISOString().replace('T', ' ').substring(0,19),
            Categorical: stat['CategoricalValues']['Status'],
            LargeGaps: stat['LargeTimestampGaps']['Status'],
            Monotonic: stat['MonotonicValues']['Status'],
            MultipleModes: stat['MultipleOperatingModes']['Status'],
            DuplicateTimestamps: stat['DuplicateTimestamps']['Count'],
            InvalidDateEntries: stat['InvalidDateEntries']['Count'],
            InvalidValues: stat['InvalidValues']['Count'],
            MissingValues: stat['MissingValues']['Count'],
        }
        
        tableItems.push(current_item)
    })

    return {signalDetails, tableColumns, tableItems}
}