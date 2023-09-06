// ------------------------------------------------------
// This functions lists all the models which were trained 
// using a given label group
// ------------------------------------------------------
export async function listModelUsingLabelGroup(gateway, labelGroupName, projectName) {
    const listModels = await getModelDescriptions(gateway, projectName)
    const listAttachedModels = []

    if (listModels['ModelSummaries'].length > 0) {
        for (const model of listModels['ModelSummaries']) {
            const modelDetails = await gateway.lookoutEquipment.describeModel(model['ModelName'])

            if (modelDetails['LabelsInputConfiguration'] && modelDetails['LabelsInputConfiguration']['LabelGroupName'] === labelGroupName) {
                listAttachedModels.push(model['ModelName'])
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
export function onClear(e, eChartRef, labels) {
    if (e['command'] && e['command'] === 'clear') {
        labels.current = []
        eChartRef.current.getEchartsInstance().dispatchAction({
            type: 'brush',
            areas: []
        })
    }
}

// -----------------------------------------------------------------
// The user can use brushes to highlight labels directly on the plot
// -----------------------------------------------------------------
export function onBrushEndEvent(e, labels, labelsTableRef) {
    let currentRanges = []
    e["areas"].forEach((area) => {
        currentRanges.push({
            "start": area.coordRange[0],
            "end": area.coordRange[1]
        })
    })

    labels.current = currentRanges
    labelsTableRef.current.updateTable(labels.current)
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
            label = label.split('-').slice(2).join('-')
            labelGroupOptions.push({'label': label, 'value': labelGroup['LabelGroupName']})
        })    
    }

    return labelGroupOptions
}