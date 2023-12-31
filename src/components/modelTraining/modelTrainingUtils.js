// ------------------------
// Called to create a model
// ------------------------
export async function createModel(
    e, 
    gateway, 
    uid, 
    trainingRange, 
    evaluationRange, 
    datasetName, 
    modelName, 
    selectedItems, 
    selectedSamplingRate,
    selectedSignal,
    selectedOption,
    offConditionValue,
    selectedLabelGroupName,
    navigate,
    setErrorMessage,
    setNavbarCounter,
    navbarCounter
) {
    e.preventDefault()
    let currentErrorMessage = ""

    // Computes training and evaluation date ranges:
    const trainingStartDate   = trainingRange.current.startDate.replace('T', ' ').substr(0, 19)
    const trainingEndDate     = trainingRange.current.endDate.replace('T', ' ').substr(0, 19)
    const evaluationStartDate = evaluationRange.current.startDate.replace('T', ' ').substr(0, 19)
    const evaluationEndDate   = evaluationRange.current.endDate.replace('T', ' ').substr(0, 19)

    // Build the schema based on the signals selected:
    let schema = {
        Components: [{
            ComponentName: datasetName.current,
            Columns: [
                { Name: "timestamp", Type: "DATETIME" }
            ]
        }]
    }

    selectedItems.forEach((signal) => {
        schema['Components'][0]['Columns'].push({
            Name: signal['name'],
            Type: "DOUBLE"
        })
    })

    // Assemble the model creation request:
    let createRequest = {
        ModelName: `${uid}-${datasetName.current}-${modelName.current}`,
        DatasetName: `l4e-demo-app-${uid}-${datasetName.current}`,
        DatasetSchema: { InlineDataSchema: JSON.stringify(schema) },
        TrainingDataStartTime: parseInt(new Date(trainingStartDate).getTime() / 1000),
        TrainingDataEndTime: parseInt(new Date(trainingEndDate).getTime() / 1000),
        EvaluationDataStartTime: parseInt(new Date(evaluationStartDate).getTime() / 1000),
        EvaluationDataEndTime: parseInt(new Date(evaluationEndDate).getTime()) / 1000,
        DataPreProcessingConfiguration: { TargetSamplingRate: selectedSamplingRate['value'] },
        Tags: [
            {"Key": "Source", "Value": "L4EDemoApp"},
            {"Key": "AppVersion", "Value": window.version},
            {"Key": "User", "Value": uid}
        ]
    }

    // Add off time detection option:
    if (selectedSignal.value) {
        createRequest['OffCondition'] = `${datasetName.current}\\${selectedSignal.value}${selectedOption.value}${offConditionValue}`
    }

    // Add labels option:
    if (selectedLabelGroupName.current) {
        createRequest['LabelsInputConfiguration'] = {
            LabelGroupName: uid + '-' + datasetName.current + '-' + selectedLabelGroupName.current
        }
    }

    // Launch the creation request:
    const response = await gateway.lookoutEquipment.createModel(createRequest)
        .then((response) => { console.log('Model training launched:', response) })
        .catch((error) => {
            console.log(error.response)
            currentErrorMessage = JSON.stringify(error.response)
        })

    // Redirect the user to this model dashboard:
    if (currentErrorMessage === "") {
        // This forces a refresh of the side bar navigation
        // so we can see the new model name popping up:
        setNavbarCounter(navbarCounter + 1)

        // We will also trigger a Step Function that will "listen"
        // to this model until training is finished:
        const sfnArn = window.modelResultsExtractionArn
        const inputPayload = { modelName: `${uid}-${datasetName.current}-${modelName.current}` }
        await gateway.stepFunctions
                        .startExecution(sfnArn, inputPayload)
                        .catch((error) => console.log(error.response))

        // Let's now redirect the user to the offline results page of this model
        navigate(`/offline-results/modelName/${modelName.current}/projectName/${datasetName.current}`)
    }
    else {
        setErrorMessage(currentErrorMessage)
    }
}