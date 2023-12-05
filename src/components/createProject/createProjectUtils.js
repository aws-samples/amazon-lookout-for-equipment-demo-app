import { getUTCDate, checkProjectNameAvailability } from '../../utils/utils.js'

// ----------------------------------------------
// Dynamically check if the project name is valid
// ----------------------------------------------
export async function checkProjectNameValidity(desiredProjectName, setProjectNameError, gateway, uid) {
    let error = true
    let errorMessage = ""

    // Error checking:
    if (desiredProjectName.length <= 2) {
        errorMessage = 'Project name must be at least 3 characters long'
    }
    else if (! /^([a-zA-Z0-9_\-]{1,170})$/.test(desiredProjectName)) {
        errorMessage = 'Project name can have up to 170 characters. Valid characters are a-z, A-Z, 0-9, _ (underscore), and - (hyphen)'
    }
    else if (! await checkProjectNameAvailability(desiredProjectName, gateway, uid)) {
        errorMessage = 'Project name not available'
    }
    else {
        error = false
    }

    if (setProjectNameError) { setProjectNameError(errorMessage) }

    return { error, errorMessage }
}

// ---------------------------------------------------
// Dynamically check if the asset description is valid
// ---------------------------------------------------
export function checkAssetDescriptionValidity(desiredAssetDescription, setAssetError) {
    let error = true
    let errorMessage = ""

    // Error checking:
    if (desiredAssetDescription.length <= 2) {
        errorMessage = 'Asset description must be at least 3 characters long'
    }
    else if (! /^([a-zA-Z0-9_\ \-/=+@:.]{1,170})$/.test(desiredAssetDescription)) {
        errorMessage = `Asset description can have up to 128 characters. Valid characters are a-z, A-Z, 0-9, and the following ones: _.:/=+-@.`
    }
    else {
        error = false
    }

    setAssetError(errorMessage)
    return error
}

// -----------------------------------------------------------------
// Extracts all the Timestream databases available from this account
// -----------------------------------------------------------------
export async function getAllDatabases(gateway) {
    const response = await gateway.timestream
                                  .listDatabases()
                                  .catch((error) => console.log(error))

    // let databasesList = [{'label': 'Select a database', value: undefined}]
    let databasesList = []
    if (response['Databases'].length > 0) {
        response['Databases'].forEach((database) => {
            databasesList.push({
                'label': database['DatabaseName'],
                'value': database['DatabaseName']
            })
        })
    }

    return databasesList
}

// ------------------------------------------------------------------
// Extracts all the Timestream tables linked to the selected database
// ------------------------------------------------------------------
export async function getAllTables(gateway, databaseName) {
    const response = await gateway.timestream
                                  .listTables(databaseName)
                                  .catch((error) => console.log(error))

    let tablesList = []
    if (response['Tables'].length > 0) {
        response['Tables'].forEach((table) => {
            tablesList.push({
                'label': table['TableName'] + ` (${table['TableStatus']})`,
                'value': table['TableName']
            })
        })
    }

    return tablesList
}

// -----------------------
// Gets all the table info
// -----------------------
export async function getTableInfos(gateway, databaseName, tableName) {
    let query = `DESCRIBE "${databaseName}"."${tableName}"`
    let response = await gateway.timestream
                                  .query(query)
                                  .catch((error) => console.log(error))

    let sensorsList = []
    let dimensionsList = []
    let timestampCol = ""

    if (response.Rows.length > 0) {
        response.Rows.forEach((row) => {
            if (row.Data[2].ScalarValue === 'DIMENSION') {
                dimensionsList.push(row.Data[0].ScalarValue)
            }
            if (row.Data[2].ScalarValue === 'TIMESTAMP') {
                timestampCol = row.Data[0].ScalarValue
            }
        })
    }
    query = `SHOW MEASURES FROM "${databaseName}"."${tableName}"`
    response = await gateway.timestream
                            .query(query)
                            .catch((error) => console.log(error))

    if (response.Rows.length > 0) {
        response.Rows.forEach((row) => {
            sensorsList.push(row.Data[0].ScalarValue)
        })
    }
    
    return { 
        sensorsList: sensorsList,
        dimensionsList: dimensionsList,
        timestampCol: timestampCol
    }
}

// --------------------------------------------------------
// Gets all the IDs corresponding to the selected dimension
// --------------------------------------------------------
export async function getAllDimensionItems(gateway, databaseName, tableName, dimension) {
    const query = `SELECT DISTINCT "${dimension}" FROM "${databaseName}"."${tableName}"`
    const response = await gateway.timestream
                                  .query(query)
                                  .catch((error) => console.log(error))

    let assetsList = []
    if (response.Rows && response.Rows.length > 0) {
        response.Rows.forEach((row) => {
            assetsList.push({label: row.Data[0].ScalarValue, value: row.Data[0].ScalarValue})
        })
    }

    return assetsList
}

// --------------------------------------------------------
// Get the extent of the sensor data for the selected asset
// --------------------------------------------------------
export async function getTimeRange(gateway, databaseName, tableName, dimensionName, asset, timestampCol) {
    const query = `SELECT MIN(${timestampCol}) AS startDate, MAX(${timestampCol}) AS endDate 
                   FROM "${databaseName}"."${tableName}" 
                   WHERE "${dimensionName}"='${asset}'`
    const response = await gateway.timestream
                                  .query(query)
                                  .catch((error) => console.log(error))

    let startDate = undefined
    let endDate = undefined
    if (response.Rows && response.Rows.length > 0) {
        startDate = getUTCDate(response.Rows[0].Data[0].ScalarValue)
        endDate = getUTCDate(response.Rows[0].Data[1].ScalarValue)
    }

    return { startDate, endDate }
}

// -----------------------------------------------------------
// Calculate the sampling rate by counting the number of
// datapoints recorded for this asset and using the time range
// -----------------------------------------------------------
export async function getSamplingRate(gateway, databaseName, tableName, dimensionName, asset, startTime, endTime) {
    let signalSamplingRate = {}
    const query = `SELECT "measure_name", COUNT(*) 
                   FROM "${databaseName}"."${tableName}"
                   WHERE "${dimensionName}"='${asset}'
                   GROUP BY "measure_name"`
    const response = await gateway.timestream
                                  .query(query)
                                  .catch((error) => console.log(error))

    if (response.Rows && response.Rows.length > 0) {
        response.Rows.forEach((row) => {
            if (row.Data[1].ScalarValue > 0) {
                signalSamplingRate[row.Data[0].ScalarValue] = Math.round((endTime - startTime) / row.Data[1].ScalarValue / 1000)
            }
            else {
                signalSamplingRate[row.Data[0].ScalarValue] = 'n/a'
            }
        })
    }
    return signalSamplingRate
}