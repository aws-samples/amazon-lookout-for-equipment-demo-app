// -----------------------------------------------------------------------------------
// This function classifies all the detected events and the provided labels. Anomalies 
// can be classified as true positives or false positives. Labels can be classified
// as detected or not.
// -----------------------------------------------------------------------------------
export function classify(events, labels, evaluationStart, earlyWarningThreshold) {
    // const EARLY_WARNING_THRESHOLD = 3 * 24 * 60 * 60 * 1000
    const EARLY_WARNING_THRESHOLD = earlyWarningThreshold * 60 * 60 * 1000
    let stats = {
        truePositives: 0,
        falsePositives: 0,
        detected: 0,
        undetected: 0,
        numLabels: 0
    }

    // Loops through all the detected events (anomalies) first:
    for (const [eventIndex, event] of events.entries()) {
        // An event will be considered a true positive if it overlaps any provided
        // label, or if it is happening up to EARLY_WARNING_THRESHOLD milliseconds before:
        const eventStart = new Date(event.start)
        const eventEnd = new Date(new Date(event.end).getTime() + EARLY_WARNING_THRESHOLD)

        // Loops through each label and compute the overlap with this detected event:
        let hasOverlap = false
        for (const label of labels) {
            hasOverlap = eventStart < label.end && eventEnd > label.start

            if (hasOverlap) {
                events[eventIndex]['truePositive'] = true
                stats.truePositives += 1
                break
            }
        }

        if (!hasOverlap) {
            events[eventIndex]['truePositive'] = false
            stats.falsePositives += 1
        }
    }

    // Loops through all the labels:
    for (const [labelIndex, label] of labels.entries()) {
        // A label will be detected if any event happen during the label 
        // or up to EARLY_WARNING_THRESHOLD milliseconds before:
        const earlyWarningEnd = label.end
        const earlyWarningStart = label.start - EARLY_WARNING_THRESHOLD
    
        // Loops through each label and compute the overlap with this detected event:
        if (earlyWarningEnd > evaluationStart) {
            let hasOverlap = false
            stats.numLabels += 1

            for (const event of events) {
                hasOverlap = earlyWarningStart < event.end && earlyWarningEnd > event.start
                if (hasOverlap) {
                    labels[labelIndex]['isDetected'] = true
                    stats.detected += 1
                    break
                }
            }

            // Classify as detected when the overlap is greater than 0:
            if (!hasOverlap) {
                labels[labelIndex]['isDetected'] = false
                stats.undetected += 1
            }
        }
    }

    // Returns all the classified events and labels
    return { events, labels, stats }
}

// ---------------------------------------------------
// Builds the eChart series to plot the anomalies. We 
// plot 2 series, one with the false positives and the 
// other with the true positives.
// ---------------------------------------------------
export function buildAnomaliesSeries(events) {
    const { truePositiveData, falsePositiveData } = buildAnomaliesTimeseries(events)

    const truePositiveSeries = {
        name: 'True positive events',
        symbol: 'none',
        data: truePositiveData,
        type: 'line',
        lineStyle: { color: "#d87a80", width: 0.5 },
        xAxisIndex: 0,
        yAxisIndex: 0,
        areaStyle: { color: '#d87a80', opacity: 0.8, origin: 0.6 }
    }

    const falsePositiveSeries = {
        name: 'False positive events',
        symbol: 'none',
        data: falsePositiveData,
        type: 'line',
        lineStyle: { color: "#d87a80", width: 0.5 },
        xAxisIndex: 0,
        yAxisIndex: 0,
        areaStyle: { color: '#d87a80', opacity: 0.2, origin: 0.6 }
    }

    return { truePositiveSeries, falsePositiveSeries }
}

// ------------------------------------------
// Builds the eChart series to plot the known 
// labels. Labels can be detected or not.
// ------------------------------------------
export function buildLabelsSeries(labels, startTime, modelSamplingRate) {
    const { detectedData, undetectedData } = buildLabelsTimeseries(labels, startTime, modelSamplingRate)

    const detectedLabelsSeries = {
        name: 'Detected labels',
        symbol: 'none',
        data: detectedData,
        type: 'line',
        color: "#97b552",
        lineStyle: { color: "#97b552", width: 0.5 },
        xAxisIndex: 0,
        yAxisIndex: 0,
        areaStyle: { color: '#97b552', opacity: 0.8 }
    }

    const undetectedLabelsSeries = {
        name: 'Undetected labels',
        symbol: 'none',
        data: undetectedData,
        type: 'line',
        color: "#97b552",
        lineStyle: { color: "#97b552", width: 0.5 },
        xAxisIndex: 0,
        yAxisIndex: 0,
        areaStyle: { color: '#97b552', opacity: 0.2 }
    }

    return { detectedLabelsSeries, undetectedLabelsSeries }
}

// -----------------------------------------------
// Derive a time series from the known labels data
// -----------------------------------------------
function buildLabelsTimeseries(labels, startTime) {
    let detectedLabelData = []
    let undetectedLabelData = []

    detectedLabelData.push([startTime, 0.0])
    undetectedLabelData.push([startTime, 0.0])

    labels.forEach((label) => {
        if (label.isDetected) {
            detectedLabelData.push([new Date(label.start.getTime() - 1), 0.0])
            detectedLabelData.push([label.start, 0.5])
            detectedLabelData.push([label.end, 0.5])
            detectedLabelData.push([new Date(label.end.getTime() + 1), 0.0])
        }
        else {
            undetectedLabelData.push([new Date(label.start.getTime() - 1), 0.0])
            undetectedLabelData.push([label.start, 0.5])
            undetectedLabelData.push([label.end, 0.5])
            undetectedLabelData.push([new Date(label.end.getTime() + 1), 0.0])
        }
    })

    return {
        detectedData: detectedLabelData,
        undetectedData: undetectedLabelData
    }
}

// -------------------------------------------------------
// Derive a time series from the detected events/anomalies
// -------------------------------------------------------
function buildAnomaliesTimeseries(events) {
    let tpData = []
    let fpData = []
    let minY = 0.6
    let maxY = 1.1

    events.forEach((event) => {
        if (event.truePositive) {
            tpData.push([event.start - 1, minY])
            tpData.push([event.start, maxY])
            tpData.push([event.end, maxY])
            tpData.push([event.end + 1, minY])
        }
        else {
            fpData.push([event.start - 1, minY])
            fpData.push([event.start, maxY])
            fpData.push([event.end, maxY])
            fpData.push([event.end + 1, minY])
        }
    })

    return {
        truePositiveData: tpData,
        falsePositiveData: fpData
    }
}

// --------------------------------------------------------------------
// From the pointwise anomalies, build the eventwise range of anomalies
// --------------------------------------------------------------------
export function getEventwiseAnomalies(items, mergeThreshold) {
    let MERGE_GAP_THRESHOLD = mergeThreshold * 60 * 60 * 1000
    let lastAnomalyX = undefined
    let start = undefined
    let events = []

    items.forEach((item) => {
        const x = new Date(parseInt(item['timestamp']['N'])*1000)
        let y = parseFloat(item['anomaly']['S'])

        // When we detect an anomaly, we record the start of the event. We 
        // also record the last time the anomaly was still detected:
        if (y == 1.0) {
            if (!start) { start = x }
            lastAnomalyX = x
        }

        // If an event is already started and we are now beyond the threshold
        // to merge with the next one, we record the event and reset the 
        // event counter:
        else if (start && ((x - lastAnomalyX) > MERGE_GAP_THRESHOLD)) {
            events.push({start: start, end: lastAnomalyX})
            start = undefined
        }
    })

    return events
}

// ---------------------------------------------------------
// Given a current date (x), returns the event it belongs to
// ---------------------------------------------------------
function getEvent(events, x) {
    const currentX = new Date(x*1000)
    for (const event of events) {
        if (currentX >= event.start && currentX <= event.end) {
            return event
        }
    }

    return undefined
}