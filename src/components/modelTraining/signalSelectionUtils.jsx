// Cloudscape components:
import Badge from "@cloudscape-design/components/badge"

export function getSignalsStatistics(signalDetails) {
    let signalInfos = {}
    let signalAttributes = {}

    signalDetails['sensorStatistics'].forEach((signal) => {
        signalInfos[signal['SensorName']] = []
        if (signal['CategoricalValues']['Status'] !== 'NO_ISSUE_DETECTED') {
            signalInfos[signal['SensorName']].push(<Badge color="red">Categorical</Badge>)
        }
        if (signal['LargeTimestampGaps']['Status'] !== 'NO_ISSUE_DETECTED') {
            signalInfos[signal['SensorName']].push(<Badge color="red">Large gaps</Badge>)
        }
        if (signal['MonotonicValues']['Status'] !== 'NO_ISSUE_DETECTED') {
            signalInfos[signal['SensorName']].push(<Badge color="red">Monotonic</Badge>)
        }
        if (signal['MultipleOperatingModes']['Status'] !== 'NO_ISSUE_DETECTED') {
            signalInfos[signal['SensorName']].push(<Badge color="blue">Multiple modes</Badge>)
        }
        if (signal['DuplicateTimestamps']['Count'] > 0) {
            signalInfos[signal['SensorName']].push(
                <Badge color="grey">
                    {signal['DuplicateTimestamps']['Count']}
                    &nbsp;duplicate(s)
                </Badge>
            )
        }
        if (signal['InvalidDateEntries']['Count'] > 0) {
            signalInfos[signal['SensorName']].push(
                <Badge color="grey">
                    {signal['InvalidDateEntries']['Count']}
                    &nbsp;invalid entries
                </Badge>
            )
        }
        if (signal['MissingValues']['Count'] > 0) {
            signalInfos[signal['SensorName']].push(
                <Badge color="grey">
                    {signal['MissingValues']['Count']}
                    &nbsp;missing value(s)
                </Badge>
            )
        }

        signalAttributes[signal['SensorName']] = {}
        signalAttributes[signal['SensorName']]['startTime'] = new Date(signal['DataStartTime'] * 1000).toISOString().substring(0, 19).replace('T', ' ')
        signalAttributes[signal['SensorName']]['endTime'] = new Date(signal['DataEndTime'] * 1000).toISOString().substring(0, 19).replace('T', ' ')
    })

    return {
        signalAttributes: signalAttributes,
        signalInfos: signalInfos
    }
}

export function buildChartOptions(tagsList, x, signals, trainingRange, evaluationRange) {
    let signalOptions = {}
    tagsList.forEach((tag) => {
        const currentSerie = [{
            name: tag,
            color: 'rgb(141, 152, 179)',
            symbol: 'none',
            sampling: 'lttb',
            data: signals[tag],
            type: 'line',
            markArea: {
                itemStyle: { color: 'rgb(151, 181, 82, 0.3)' },
                data: [
                    [
                        {
                            name: 'Training',
                            xAxis: new Date(trainingRange.current['startDate']).toISOString().substring(0, 19).replace('T', '\n')
                        },
                        {
                            xAxis: new Date(trainingRange.current['endDate']).toISOString().substring(0, 19).replace('T', '\n')
                        }
                    ],
                ]
            }
        }]

        // echart options:
        const currentOption = {
            title: { show: false },
            xAxis: { 
                type: 'category', 
                data: x, 
                min: new Date(trainingRange.current['startDate']).toISOString().substring(0, 19).replace('T', '\n'),
                max: new Date(evaluationRange.current['endDate']).toISOString().substring(0, 19).replace('T', '\n'),
            },
            yAxis: { type: 'value' },
            grid: { top: 15, left: 40, right: 10, bottom: 35 },
            series: currentSerie,
            animation: false,
        }

        signalOptions[tag] = currentOption
    })

    return signalOptions
}