// Imports:
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react'
import { Auth } from 'aws-amplify'
import { useNavigate } from 'react-router-dom'

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
import DatePicker   from "@cloudscape-design/components/date-picker"
import Flashbar     from "@cloudscape-design/components/flashbar"
import FormField    from "@cloudscape-design/components/form-field"
import Multiselect  from "@cloudscape-design/components/multiselect"
import Select       from "@cloudscape-design/components/select"
import Spinner      from "@cloudscape-design/components/spinner"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Textarea     from "@cloudscape-design/components/textarea"

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext.jsx'

// Utils:
import { getUTCDate, waitForPipelineStart, checkProjectNameAvailability } from '../../utils/utils.js'
import { checkAssetDescriptionValidity } from './createProjectUtils.js'

// -----------------------------------------------------------------
// Extracts all the Timestream databases available from this account
// -----------------------------------------------------------------
async function getAllDatabases(gateway) {
    const response = await gateway.timestream
                                  .listDatabases()
                                  .catch((error) => console.log(error))

    let databasesList = [{'label': 'Select a database', value: undefined}]
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
async function getAllTables(gateway, databaseName) {
    const response = await gateway.timestream
                                  .listTables(databaseName)
                                  .catch((error) => console.log(error))

    let tablesList = [{'label': 'Select a table', value: undefined}]
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
async function getTableInfos(gateway, databaseName, tableName) {
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
async function getAllDimensionItems(gateway, databaseName, tableName, dimension) {
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
async function getTimeRange(gateway, databaseName, tableName, dimensionName, asset, timestampCol) {
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
async function getSamplingRate(gateway, databaseName, tableName, dimensionName, asset, startTime, endTime) {
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

// --------------------------
// Component main entry point
// --------------------------
const TimestreamImport = forwardRef(function TimestreamImport(props, ref) {
    // Component state definition:
    const projectName         = props.projectName
    const assetDescription    = props.assetDescription
    const setUploadInProgress = props.setUploadInProgress
    const setErrorMessage     = props.setErrorMessage
    const setAssetError       = props.setAssetError

    const { gateway, uid, navbarCounter, setNavbarCounter } = useContext(ApiGatewayContext)

    const [ identityId, setIdentityId ]                 = useState("")
    const [ databasesList, setDatabasesList ]           = useState(undefined)
    const [ tablesList, setTablesList ]                 = useState(undefined)
    const [ dimensionsOptions, setDimensionsOptions ]   = useState(undefined)
    const [ tagsOptions, setTagsOptions ]               = useState(undefined)
    const [ assetsList, setAssetsList ]                 = useState(undefined)
    const [ database, setDatabase ]                     = useState(undefined)
    const [ table, setTable ]                           = useState(undefined)
    const [ dimension, setDimension ]                   = useState(undefined)
    const [ sensors, setSensors ]                       = useState(undefined)
    const [ asset, setAsset ]                           = useState(undefined)
    const [ timestamp, setTimestamp ]                   = useState(undefined)
    const [ exportStartDate, setExportStartDate ]       = useState(undefined)
    const [ exportEndDate, setExportEndDate ]           = useState(undefined)
    const [ signalSamplingRate, setSignalSamplingRate ] = useState(undefined)
    const [ unloadSamplingRate, setUnloadSamplingRate ] = useState(undefined)
    const [ assetLoading, setAssetLoading ]             = useState("")
    const [ showFlashbar, setShowFlashbar ]             = useState(false)

    const navigate = useNavigate()

    useEffect(() => {
        Auth.currentUserCredentials()
        .then((credentials) => setIdentityId(credentials.identityId))
    })
    
    // This function is called by the parent component to trigger the import:
    useImperativeHandle(ref, () => ({
        async processTimestreamImport() {
            let currentError = ""
            let timestreamConnectionDefined = database && table && dimension && 
                                              sensors && asset && unloadSamplingRate && 
                                              exportStartDate && exportEndDate
    
            // Error checking:
            if (projectName.length <= 2) {
                currentError = 'Project name must be at least 3 characters long'
            }
            else if (! /^([a-zA-Z0-9_\-]{1,170})$/.test(projectName)) {
                currentError = 'Project name can have up to 170 characters. Valid characters are a-z, A-Z, 0-9, _ (underscore), and - (hyphen)'
            }
            else if (!timestreamConnectionDefined) {
                currentError = 'Timestream connection is not fully configured'
            }
            else if (!await checkProjectNameAvailability(projectName, gateway, uid)) {
                currentError = 'Project name not available'
            }
            else if (checkAssetDescriptionValidity(assetDescription, setAssetError)) {
                currentError = 'Asset / process description is invalid'
            }

            if (currentError === "") {
                setErrorMessage("")
                setShowFlashbar(true)
                setUploadInProgress(true)

                const sensorsList = sensors.map((sensor) => { return `'${sensor.label}'` }).join(',')
                const unloadQuery = `UNLOAD(
                                        SELECT "measure_name", BIN(${timestamp}, ${unloadSamplingRate.value}s) AS "${timestamp}", AVG("measure_value::double") AS "measure_value"
                                            FROM "${database.value}"."${table.value}"
                                            WHERE measure_name IN (${sensorsList})
                                            AND ${timestamp} BETWEEN '${exportStartDate}' AND '${exportEndDate}'
                                            AND "${dimension.value}" = '${asset.value}'
                                            GROUP BY "measure_name", BIN(${timestamp}, ${unloadSamplingRate.value}s)
                                            ORDER BY "measure_name" ASC, BIN(${timestamp}, ${unloadSamplingRate.value}s) ASC
                                    )
                                    TO 's3://${window.appS3Bucket}/timestream/${identityId}/${projectName}/'
                                    WITH (format='PARQUET', compression='GZIP')`

                const inputPayload = { 
                    unloadQuery: unloadQuery,
                    datasetPreparationSfnArn: window.datasetPreparationArn,
                    uid: uid,
                    assetDescription: assetDescription,
                    timestampCol: timestamp,
                    detail: {
                        bucket: { name: window.appS3Bucket },
                        object: { key: `private/${identityId}/${projectName}/${projectName}/sensors.csv` },
                        unloadObject: { key: `timestream/${identityId}/${projectName}/` }
                    }
                }

                const sfnArn = window.timestreamUploadArn
                await gateway.stepFunctions
                            .startExecution(sfnArn, inputPayload)
                            .catch((error) => console.log(error.response))

                await waitForPipelineStart(gateway, uid, projectName)

                // This forces a refresh of the side bar navigation
                // so we can see the new project name popping up:
                setNavbarCounter(navbarCounter + 1)

                // Redirects to the dashboard for the new project:
                navigate(`/project-dashboard/projectName/${projectName}`)
            }
            else {
                setErrorMessage(currentError)
            }
        }
    }))

    // Start by listing all the databases available in this account and region:
    useEffect(() => {
        getAllDatabases(gateway)
        .then((x) => setDatabasesList(x))
    }, [gateway, uid])

    useEffect(() => {
        if (dimension) {
            setAssetLoading("loading")
            getAllDimensionItems(gateway, database.value, table.value, dimension.value)
            .then((x) => {
                setAssetsList(x)
                setAssetLoading("")
            })
        }
    }, [gateway, dimension])

    // Render the component:
    let children = undefined
    if (databasesList) {
        let sensorsList = []
        let maxSamplingRate = 0
        if (sensors && signalSamplingRate) {
            for (const s of sensors) {
                sensorsList.push('- ' + s.label + ' (~' + signalSamplingRate[s.label] + 's)')
                if (signalSamplingRate[s.label] !== 'n/a') {
                    if (signalSamplingRate[s.label] > maxSamplingRate) {
                        maxSamplingRate = signalSamplingRate[s.label]
                    }
                }
            }
        }
        sensorsList = sensorsList.join('\n')

        children = (
            <SpaceBetween size="xl">
                {/* ------------------
                    Database selection
                    ------------------ */}
                <FormField 
                    label="Select a Timestream database"
                    description={(<>
                                    To use this importing method, you will need to have your equipment or process data stored in 
                                    a single Timestream table (e.g. <b>SensorData</b>). Your piece of equipment or process 
                                    must be referenced by an ID stored in a single field of this table (e.g. <b>EquipmentId</b>).
                                 </>)}
                >
                    <Select 
                        selectedOption={database}
                        onChange={async ({ detail }) => { 
                            setDatabase(detail.selectedOption)
                            const tablesOptions = await getAllTables(gateway, detail.selectedOption.value)
                            setTablesList(tablesOptions)
                        }}
                        options={databasesList}
                        placeholder="Select a database"
                    />
                </FormField>

                {/* ----------------------------------------------------------------------
                    Once the database is selected, we let the user selects the right table
                    ---------------------------------------------------------------------- */}
                { tablesList && <FormField label="Select a Timestream table">
                    <Select 
                        selectedOption={table}
                        onChange={async ({ detail }) => { 
                            setTable(detail.selectedOption)
                            const { sensorsList, dimensionsList, timestampCol } = await getTableInfos(gateway, database.value, detail.selectedOption.value)
                            setTimestamp(timestampCol)

                            let options = []
                            dimensionsList.forEach((dim) => {
                                options.push({label: dim, value: dim})
                            })
                            setDimensionsOptions(options)

                            options = []
                            sensorsList.forEach((sensor) => {
                                options.push({label: sensor, value: sensor})
                            })
                            setTagsOptions(options)
                            setSensors(options)
                        }}
                        options={tablesList}
                        placeholder="Select a table"
                    />
                </FormField> }

                {/* -----------------------------------------------------------------
                    When the table is selected, the user needs to point the dimension
                    which contains the asset ID to be monitored:
                    ----------------------------------------------------------------- */}
                { dimensionsOptions && <FormField 
                    label="Select a dimension" 
                    description="Select the dimension that contain the IDs of your processes or pieces of equipment to be monitored"
                >
                    <Select 
                        selectedOption={dimension}
                        onChange={({ detail }) => { 
                            setAsset(undefined)
                            setAssetsList([])
                            setDimension(detail.selectedOption)
                            setAssetLoading("loading")
                        }}
                        options={dimensionsOptions}
                        placeholder="Select a dimension"
                    />
                </FormField> }
                    
                {/* ----------------------------------------
                    When the dimension is selected, the user 
                    needs to select which asset to monitor
                    ---------------------------------------- */}
                { dimension && <FormField 
                    label="Select the asset" 
                    description="Now select the asset (process or piece of equipment) you'd like to monitor"
                >
                    { assetLoading === "" && <Select 
                        selectedOption={asset}
                        onChange={async ({ detail }) => {
                            setAsset(detail.selectedOption)

                            const { startDate, endDate } = await getTimeRange(gateway, database.value, table.value, dimension.value, detail.selectedOption.value, timestamp)
                            setExportStartDate(startDate.toISOString().slice(0, 10))
                            setExportEndDate(endDate.toISOString().slice(0, 10))

                            const samplingRates = await getSamplingRate(gateway, database.value, table.value, dimension.value, detail.selectedOption.value, startDate.getTime(), endDate.getTime())
                            setSignalSamplingRate(samplingRates)
                        }}
                        options={assetsList}
                        placeholder="Select an asset"
                        statusType={assetLoading}
                    /> }

                    { assetLoading === "loading" && <Spinner /> }
                </FormField> }

                { dimension && tagsOptions && asset && <>
                    { exportStartDate && <SpaceBetween size="xl">
                        <FormField 
                            label="Time range" 
                            description={(<>The available data for this asset (<b>{asset.value}</b>) ranges from <b>{exportStartDate}</b>&nbsp;
                                          to <b>{exportEndDate}</b>. Select the range you would like to export:</>)}
                        >
                            <SpaceBetween size="l" direction="horizontal">
                                <FormField label="From:">
                                    <DatePicker
                                        onChange={({ detail }) => setExportStartDate(detail.value)}
                                        value={exportStartDate}
                                        placeholder="YYYY-MM-DD"
                                    />
                                </FormField>
                                <FormField label="To:">
                                    <DatePicker
                                        onChange={({ detail }) => setExportEndDate(detail.value)}
                                        value={exportEndDate}
                                        placeholder="YYYY-MM-DD"
                                    />
                                </FormField>
                            </SpaceBetween>
                        </FormField>

                        { !signalSamplingRate && <Spinner /> }

                        { signalSamplingRate && <SpaceBetween size="xl">
                            <FormField 
                                label="Select the sensors" 
                                description="Select the measurements that contain the sensors you want to use to monitor your process or piece of equipment"
                            >
                                <Multiselect 
                                    selectedOptions={sensors}
                                    onChange={({ detail }) => setSensors(detail.selectedOptions)}
                                    options={tagsOptions}
                                    placeholder={`Choose measurements ${sensors.length > 0 ? '(' + sensors.length + ' selected)' : ''}`}
                                    virtualScroll={true}
                                    hideTokens={true}
                                    filteringType="auto"
                                />
                            </FormField>

                            <FormField label="Selected measurements (sampling rate)">
                                <Textarea
                                    value={sensorsList}
                                    readOnly={true}
                                    rows={sensors.length > 10 ? 10 : sensors.length}
                                />
                            </FormField>

                            <FormField 
                                label="Select a resampling rate"
                                description={(<>
                                    This process will resample your data before extracting them. Select
                                    a sampling rate greater or equal than the maximum sampling rate of your
                                    signals (<b>{maxSamplingRate} seconds</b>):
                                </>)}
                            >
                                <Select
                                    selectedOption={unloadSamplingRate}
                                    onChange={({ detail }) => setUnloadSamplingRate(detail.selectedOption)}
                                    options={[
                                        { label: "5 minutes", value: "300" },
                                        { label: "10 minutes", value: "600" },
                                        { label: "15 minutes", value: "900" },
                                        { label: "30 minutes", value: "1800" },
                                        { label: "60 minutes", value: "3600" }
                                    ]}
                                    placeholder="Select a sampling rate"
                                />

                            </FormField>
                        </SpaceBetween> }
                    </SpaceBetween> }

                    { !exportStartDate && <Spinner /> }
                </> }

                { showFlashbar && <Flashbar items={[{
                    type: 'info',
                    loading: true,
                    content: "Launching the extraction and ingestion pipeline: don't navigate away from this page, you will be automatically redirected to your new project dashboard in a few seconds."
                }]} /> }

                { !showFlashbar && signalSamplingRate && <Alert>
                    After extraction, your data is ingested and optimized for visualization purpose. You will be redirected to the project dashboard in the meantime.
                </Alert> }
            </SpaceBetween>
        )
    }
    else {
        children = <Spinner />
    }

    return children
})

export default TimestreamImport