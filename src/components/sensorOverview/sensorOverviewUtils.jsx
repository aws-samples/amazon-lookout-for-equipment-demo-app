import CategoricalFlag from '../shared/CategoricalFlag'
import StatusIndicator from '@cloudscape-design/components/status-indicator'
import { getSignalDetails } from '../../utils/dataExtraction'

// -------------------------
// Plot a signal time series
// -------------------------
export function buildChartOptions(items, sensorName, zoomStart, zoomEnd) {
    // Building the data to feed the time series: x will contain the 
    // x-axis tick labels and y the values taken by the signal over time:
    let data = []
    items.forEach((item) => {
        if (item[sensorName]) {
            const x = new Date(item['timestamp']['S'])
            const y = parseFloat(item[sensorName]['S'])
            data.push([x, y])
        }
    })

    // Configure the series to be plotted with echart:
    const series = [{
        name: sensorName,
        symbol: 'none',
        sampling: 'lttb',
        data: data,
        type: 'line',
        color: 'rgb(141, 152, 179)',
        emphasis: { disabled: true },
        tooltip: { valueFormatter: (value) => value.toFixed(2) },
    }]

    // echart options:
    const chartOptions = {
        xAxis: { type: 'time' },
        yAxis: { type: 'value' },
        series: series,
        animation: false,
        dataZoom: [{ start: zoomStart, end: zoomEnd, type: 'slider'}],
        grid: {top: 35, bottom: 90, left: 60, right: 10},
        brush: {
            toolbox: ['lineX', 'clear'],
            xAxisIndex: 0,
            brushMode: "single",
            brushStyle: {
                color: 'rgba(151, 181, 82, 0.2)',
                borderColor: 'rgba(151, 181, 82, 0.7)'
            }
        },
        tooltip: { show: true, trigger: 'axis' }
    }

    return chartOptions
}

// -------------------------------------------------------------------------------------
// Builds the columns and items to be displayed in the signal grading table of this page
// -------------------------------------------------------------------------------------
export async function buildTableItems(gateway, uid, projectName) {
    if (!uid) {
        return {
            signalDetails: undefined, 
            tableColumns: undefined, 
            tableItems: undefined
        }
    }
    
    const signalDetails = await getSignalDetails(gateway, `${uid}-${projectName}`)

    // Defining columns for the table:
    const tableColumns = [
        {id: "SensorName", header: "Sensor", cell: e => e.SensorName, sortingField: 'SensorName'},
        {id: "Grade", header: "Grade", cell: e => (<b>{e.Grade}</b>), sortingField: 'Grade'},
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
    let tableItems = []
    signalDetails['sensorStatistics'].forEach((stat) => {
        const { grade } = getSignalGrading(stat)
        const current_item = {
            SensorName: stat['SensorName'],
            Grade: grade,
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

export function getSignalGrading(stat) {
    let grade = <StatusIndicator type="success">High</StatusIndicator>
    let gradeStatus = 'High'

    const categorical = stat.CategoricalValues.Status !== 'NO_ISSUE_DETECTED'
    const noData = stat.DataExists == false
    const duplicate = stat.DuplicateTimestamps.Count > 0
    const nonNumericalValues = stat.InvalidValues.Count > 0
    const largeGaps = stat.LargeTimestampGaps.Status !== 'NO_ISSUE_DETECTED'
    const missingValues = stat.MissingValues.Count > 0
    const monotonic = stat.MonotonicValues.Status !== 'NO_ISSUE_DETECTED'
    const multipleModes = stat.MultipleOperatingModes.Status !== 'NO_ISSUE_DETECTED'
    const insufficientData = (stat.DataEndTime - stat.DataStartTime) < 86400 * 14

    if (noData || insufficientData || monotonic) {
        grade = <StatusIndicator type="error">Low</StatusIndicator>
        gradeStatus = 'Low'
    }
    else if (largeGaps || multipleModes || missingValues || categorical || nonNumericalValues || duplicate) {
        grade = <StatusIndicator type="warning">Medium</StatusIndicator>
        gradeStatus = 'Medium'
    }

    return { grade, gradeStatus }
}