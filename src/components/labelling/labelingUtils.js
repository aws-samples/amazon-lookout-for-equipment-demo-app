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

