// ------------------------------------------------------
// This functions lists all the models which were trained 
// using a given label group
// ------------------------------------------------------
export async function listModelUsingLabelGroup(gateway, labelGroupName, projectName) {
    const listAttachedModels = []

    if (labelGroupName !== "NewGroup") {
        const listModels = await getModelDescriptions(gateway, projectName)
        
        if (listModels['ModelSummaries'].length > 0) {
            for (const model of listModels['ModelSummaries']) {
                const modelDetails = await gateway.lookoutEquipment.describeModel(model['ModelName'])

                if (modelDetails['LabelsInputConfiguration'] && modelDetails['LabelsInputConfiguration']['LabelGroupName'] === labelGroupName) {
                    listAttachedModels.push(model['ModelName'])
                }
            }
        }
    }

    return listAttachedModels
}

// ----------------------------------------------------------
// Get all the models linked to a given L4E project / dataset
// ----------------------------------------------------------
async function getModelDescriptions(gateway, projectName) {
    const lookoutEquipmentProjectName = `l4e-demo-app-${projectName}`
    const modelsList = await gateway.lookoutEquipment.listModels(lookoutEquipmentProjectName)

    return modelsList
}

// -------------------------------------------------------------------
// As soon as the chart is ready, we plot the loaded labels as brushes
// -------------------------------------------------------------------
export function redrawBrushes(eChartRef, labels) {
    if (eChartRef && eChartRef.current) {
        let areasList = []

        if (labels.current.length > 0) {
            labels.current.forEach((label) => {
                // First, create the area:
                areasList.push({
                    brushType: 'lineX',
                    coordRange: [label['start'], label['end']],
                    xAxisIndex: 0
                })
            })
        }

        eChartRef.current.getEchartsInstance().dispatchAction({
            type: 'brush',
            areas: areasList
        })
    }
}

// -------------------------------------------------------
// Called when clearing the selection: this action removes
// all the labels from the plots and the table below
// -------------------------------------------------------
export function onClear(e, eChartRef, labels, storedRanges) {
    if (e['command'] && e['command'] === 'clear') {
        labels.current = []
        storedRanges.current = []
        eChartRef.current.getEchartsInstance().dispatchAction({
            type: 'brush',
            areas: []
        })
    }
}

// -----------------------------------------------------------------
// The user can use brushes to highlight labels directly on the plot
// -----------------------------------------------------------------
export function onBrushEndEvent(e, labels, labelsTableRef, storedRanges, eChartRef) {
    let refreshAreas = false

    // If the stored areas and the new areas don't have the
    // same size, we add the last area to the storedRanges:
    if (e.areas.length > storedRanges.current.length) {
        storedRanges.current.push(e.areas[e.areas.length - 1])
    }

    // If they have the same size, then one area may have been 
    // modified. In all cases, we loop through all of them to identify 
    // a modified one. Note that the modified area is necessarily one
    // that has a non-null width as it is one visible given the current
    // data zoom:
    e.areas.forEach((area, index) => {
        const start = area.coordRange[0]
        const end = area.coordRange[1]
        const storedRangeStart = storedRanges.current[index].coordRange[0]
        const storedRangeEnd = storedRanges.current[index].coordRange[1]

        // The current area is not null and it has different coordinates: this 
        // looks like an updated range, we update its record in storedRanges:
        if (start != end && (start != storedRangeStart || end != storedRangeEnd)) {
            storedRanges.current[index] = area
        }

        // Both coordinates are the same:
        else if (start == end) {
            refreshAreas = true
        }
    })

    let currentRanges = []
    storedRanges.current.forEach((area) => {
        currentRanges.push({
            "start": area.coordRange[0],
            "end": area.coordRange[1]
        })
    })

    labels.current = currentRanges
    labelsTableRef.current.updateTable(labels)

    // If a refresh is necessary, we trigger it:
    if (refreshAreas && eChartRef) {
        let areasList = []
        storedRanges.current.forEach((label) => {
            areasList.push({
                brushType: 'lineX',
                coordRange: [label.coordRange[0], label.coordRange[1]],
                xAxisIndex: 0
            })
        })

        eChartRef.current.getEchartsInstance().dispatchAction({
            type: 'brush',
            areas: areasList
        })
    }
}

// --------------------------------------
// Get the list of available label groups
// --------------------------------------
export async function getLabelGroups(gateway, uid, projectName, emptyGroupName) {
    const response = await gateway.lookoutEquipment.listLabelGroups(uid + '-' + projectName + '-')

    let labelGroupOptions = [{label: emptyGroupName, value: 'NewGroup'}]
    if (response['LabelGroupSummaries'].length > 0) {
        response['LabelGroupSummaries'].forEach((labelGroup) => {
            let label = labelGroup['LabelGroupName']
            label = label.slice(projectName.length + 1 + uid.length + 1)
            labelGroupOptions.push({'label': label, 'value': labelGroup['LabelGroupName']})
        })    
    }

    return labelGroupOptions
}