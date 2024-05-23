import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react'

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
import DatePicker   from "@cloudscape-design/components/date-picker"
import Flashbar     from "@cloudscape-design/components/flashbar"
import FormField    from "@cloudscape-design/components/form-field"
import Multiselect  from "@cloudscape-design/components/multiselect"
import Select       from "@cloudscape-design/components/select"
import Spinner      from "@cloudscape-design/components/spinner"
import SpaceBetween from "@cloudscape-design/components/space-between"

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext.jsx'

// Utils:
import { waitForPipelineStart } from '../../utils/utils.js'
import { 
    checkProjectNameValidity, 
    checkAssetDescriptionValidity
} from './createProjectUtils.js'

// -----------------------------------------------------------
// Extracts all the Glue databases available from this account
// -----------------------------------------------------------
export async function getAllGlueDatabases(gateway) {
    const response = await gateway.glue
                                  .getDatabases()
                                  .catch((error) => console.log(error))

    let databasesList = []
    if (response['DatabaseList'].length > 0) {
        response['DatabaseList'].forEach((database) => {
            databasesList.push({
                'label': database['Name'],
                'value': database['Name']
            })
        })
    }

    return databasesList
}

// ------------------------------------------------------------
// Extracts all the Glue tables linked to the selected database
// ------------------------------------------------------------
export async function getAllGlueTables(gateway, databaseName) {
    const response = await gateway.glue
                                  .getTables(databaseName)
                                  .catch((error) => console.log(error))

    let tablesList = []
    if (response['TableList'].length > 0) {
        response['TableList'].forEach((table) => {
            tablesList.push({
                'label': table['Name'],
                'value': table['Name']
            })
        })
    }

    return tablesList
}

// -----------------------
// Gets all the table info
// -----------------------
export async function getTableInfos(gateway, databaseName, tableName) {
    const response = await gateway.glue
                                  .getTable(databaseName, tableName)
                                  .catch((error) => console.log(error))

    let sensorsList = []
    let timestampsFields = []
    let measurements = []
    const cols = response.Table.StorageDescriptor.Columns
    const validTypes = ['bigint', 'int', 'smallint', 'string', 'tinyint', 'varchar']
    const timestampValidTypes = ['bigint', 'int', 'smallint', 'string', 'tinyint', 'varchar', 'date', 'timestamp']
    const measurementTypes = ['decimal', 'double', 'float']

    cols.forEach((sensor) => {
        if (validTypes.indexOf(sensor.Type) > 0) {
            sensorsList.push(sensor.Name)
        }
        if (timestampValidTypes.indexOf(sensor.Type) > 0) {
            timestampsFields.push(sensor.Name)
        }
        if (measurementTypes.indexOf(sensor.Type) > 0) {
            measurements.push({label: sensor.Name, value: sensor.Name})
        }
    })

    return { measurements, sensorsList, timestampsFields }
}

// ---------------------------------------------------
// Get the start and end timestamp from the Glue table
// ---------------------------------------------------
export async function getTimestamps(gateway, databaseName, tableName, fieldName) {
    const query = `SELECT MIN(${fieldName}) AS startTime, MAX(${fieldName}) AS endTime FROM "${databaseName}"."${tableName}"`
    const s3Path = `s3://${appS3Bucket}/athena/`
    const response = await gateway.glue
                                  .query(query, s3Path)
                                  .catch((error) => console.log(error))

    // const key = response.ResultSet.Rows[1].Data[0].keys()[0]
    const startTime = response.ResultSet.Rows[1].Data[0].VarCharValue
    const endTime = response.ResultSet.Rows[1].Data[1].VarCharValue

    return {startTime, endTime}
}

// ----------------------------------------
// Get the first 5 timestamps in the table:
// ---------------------------------------- 
export async function getTimestampSnippets(gateway, databaseName, tableName, fieldName) {
    const query = `SELECT ${fieldName} FROM "${databaseName}"."${tableName}" LIMIT 5`
    const s3Path = `s3://${appS3Bucket}/athena/`
    const response = await gateway.glue
                                  .query(query, s3Path)
                                  .catch((error) => console.log(error))

    let timestampsList = []
    response.ResultSet.Rows.forEach((row, index) => {
        if (index > 0) {
            const data = row.Data[0]
            const key = Object.keys(data)[0]
            timestampsList.push(data[key])
        }
    })

    return timestampsList
}

const GlueImport = forwardRef(function GlueImport(props, ref) {
    // Component state definition:
    const projectName         = props.projectName
    const assetDescription    = props.assetDescription
    const setUploadInProgress = props.setUploadInProgress
    const setErrorMessage     = props.setErrorMessage
    const errorMessage        = props.errorMessage
    const setAssetError       = props.setAssetError

    const [ databasesList, setDatabasesList ]           = useState(undefined)
    const [ tablesList, setTablesList ]                 = useState(undefined)

    const [ database, setDatabase ]                     = useState(undefined)
    const [ table, setTable ]                           = useState(undefined)
    const [ sensors, setSensors ]                       = useState(undefined)
    const [ timestampFields, setTimestampFields ]       = useState(undefined)
    const [ filterField, setFilterField ]               = useState(undefined)
    const [ timestampCol, setTimestampCol ]             = useState(undefined)
    const [ exportStartDate, setExportStartDate ]       = useState(undefined)
    const [ exportEndDate, setExportEndDate ]           = useState(undefined)
    const [ minStartDate, setMinStartDate ]             = useState(undefined)
    const [ maxEndDate, setMaxEndDate ]                 = useState(undefined)
    const [ unloadSamplingRate, setUnloadSamplingRate ] = useState(undefined)
    const [ measurementOptions, setMeasurementOptions ] = useState(undefined)
    const [ measurementList, setMeasurementList ]       = useState(undefined)
    const [ showFlashbar, setShowFlashbar ]             = useState(false)

    const { gateway, uid, navbarCounter, setNavbarCounter } = useContext(ApiGatewayContext)

    // Start by listing all the databases available in this account and region:
    useEffect(() => {
        getAllGlueDatabases(gateway)
        .then((x) => setDatabasesList(x))
    }, [gateway, uid])

    // This function is called by the parent component to trigger the import:
    useImperativeHandle(ref, () => ({
        async processTimestreamImport() {
            let currentError = ""
            let glueConnectionDefined = database && table && unloadSamplingRate && timestampCol &&
                                        ((filterField && sensors.length > 1) || sensors.length == 1)


            // Error checking:
            let { error, errorMessage } = await checkProjectNameValidity(projectName, undefined, gateway, uid)
            if (error) {
                currentError = errorMessage
            }
            else if (checkAssetDescriptionValidity(assetDescription, setAssetError)) {
                currentError = 'Asset / process description is invalid'
            }
            else if (!glueConnectionDefined) {
                currentError = 'Glue data catalog connection is not fully configured'
            }
            else if (measurementList.length == 0) {
                currentError = 'You must selected at least one measurement'
            }
            else if (!(exportStartDate && exportEndDate)) {
                currentError = 'You must select a time range to export'
            }
            else if (exportStartDate < minStartDate || exportStartDate > maxEndDate) {
                currentError = `Your export start date must be between ${minStartDate} and ${maxEndDate}`
            }
            else if (exportEndDate < minStartDate || exportEndDate > maxEndDate) {
                currentError = `Your export end date must be between ${minStartDate} and ${maxEndDate}`
            }

            if (currentError === "") {
                setErrorMessage("")
                setShowFlashbar(true)
                // setUploadInProgress(true)

                const sensorsList = measurementList.map((sensor) => { return `'${sensor.label}'` }).join(',')
                const unloadQuery = `SELECT ${sensorsList} 
                                     FROM "${database.value}"."${table.value}"
                                     WHERE ${timestampCol} BETWEEN ${exportStartDate} AND ${exportEndDate}`


                                    //  SELECT "motor-journal-bearing-de-temperature"
                                    //  FROM "lookout-equipment-datasets"."datasets"
                                    //  WHERE date_parse(timestamp, '%Y-%m-%d %H:%i:%S') >= DATE('2020-01-01')
                                    //    AND date_parse(timestamp, '%Y-%m-%d %H:%i:%S') <= DATE('2023-01-01')
                                    //  LIMIT 10

                console.log(unloadQuery)
            }
            else {
                setErrorMessage(currentError)
            }
        }
    }))

    // Render the component:
    let children = undefined
    // console.log('filterField:', filterField)
    if (databasesList) {
        children = (
            <SpaceBetween size="xl">
                {/* ------------------
                    Database selection
                    ------------------ */}
                { databasesList.length > 0 && <FormField 
                    label="Select a database"
                    description={(<>
                                    To use this importing method, you will need to have your equipment or process data stored in 
                                    a single Glue data catalog table (e.g. <b>SensorData</b>). Your piece of equipment or process 
                                    must be referenced by an ID stored in a single field of this table (e.g. <b>EquipmentId</b>).
                                 </>)}
                >
                    <Select 
                        selectedOption={database}
                        onChange={async ({ detail }) => { 
                            setDatabase(detail.selectedOption)
                            const tablesOptions = await getAllGlueTables(gateway, detail.selectedOption.value)
                            setTablesList(tablesOptions)
                        }}
                        options={databasesList}
                        placeholder="Select a database"
                    />
                </FormField> }

                { databasesList.length == 0 && <FormField><Alert type="warning">
                    No database found in your AWS Glue data catalog.
                </Alert></FormField> }

                {/* ----------------------------------------------------------------------
                    Once the database is selected, we let the user selects the right table
                    ---------------------------------------------------------------------- */}
                { tablesList && tablesList.length > 0 && <FormField label="Select a table">
                    <Select 
                        selectedOption={table}
                        onChange={async ({ detail }) => { 
                            setTable(detail.selectedOption)
                            const { measurements, sensorsList, timestampsFields } = await getTableInfos(gateway, database.value, detail.selectedOption.value)
                            
                            let options = [{label: 'No filter', value: 'No filter'}]
                            setFilterField({label: 'No filter', value: 'No filter'})
                            sensorsList.forEach((sensor) => {
                                options.push({label: sensor, value: sensor})
                            })
                            setSensors(options)

                            options = []
                            // setTimestampCol({label: timestampsFields[0], value: timestampsFields[0]})
                            timestampsFields.forEach((sensor) => {
                                options.push({label: sensor, value: sensor})
                            })
                            setTimestampFields(options)

                            setMeasurementOptions(measurements)
                            setMeasurementList(measurements)
                        }}
                        options={tablesList}
                        placeholder="Select a table"
                    />
                </FormField> }

                { timestampFields && timestampFields.length > 0 && <FormField 
                    label="Select the timestamp field"
                    description="Time series data needs a field with a timestamp. Select which field 
                                 to use as the timestamp to extract data from the selected table."
                >
                    <Select
                        selectedOption={timestampCol}
                        onChange={async ({ detail }) => {
                            setTimestampCol({label: detail.selectedOption.value, value: detail.selectedOption.value})
                            setSensors(sensors.filter((item) => {
                                if (item.value !== detail.selectedOption.value) { return true }
                            }))

                            const { startTime, endTime } = await getTimestamps(
                                gateway, 
                                database.value, 
                                table.value,
                                detail.selectedOption.value
                            )

                            getTimestampSnippets(
                                gateway, 
                                database.value, 
                                table.value,
                                detail.selectedOption.value
                            )

                            setExportStartDate(startTime.slice(0, 10))
                            setMinStartDate(startTime.slice(0, 10))
                            setExportEndDate(endTime.slice(0, 10))
                            setMaxEndDate(endTime.slice(0, 10))

                        }}
                        options={timestampFields}
                    />
                </FormField> }

                { timestampCol && !minStartDate && <Spinner /> }

                { minStartDate !== undefined && <SpaceBetween size="xl">
                    <FormField 
                        label="Time range" 
                        description={(<>The available data for this export ranges from <b>{minStartDate}</b>&nbsp;
                                        to <b>{maxEndDate}</b>. Select the range you would like to export:</>)}
                    >
                        <SpaceBetween size="l" direction="horizontal">
                            <FormField label="From:">
                                <DatePicker
                                    onChange={({ detail }) => setExportStartDate(detail.value)}
                                    value={exportStartDate}
                                    placeholder="YYYY-MM-DD"
                                    invalid={errorMessage && (!exportStartDate || exportStartDate < minStartDate || exportStartDate > maxEndDate)}
                                />
                            </FormField>
                            <FormField label="To:">
                                <DatePicker
                                    onChange={({ detail }) => setExportEndDate(detail.value)}
                                    value={exportEndDate}
                                    placeholder="YYYY-MM-DD"
                                    invalid={errorMessage && (!exportEndDate || exportEndDate < minStartDate || exportEndDate > maxEndDate)}
                                />
                            </FormField>
                        </SpaceBetween>
                    </FormField>

                    <FormField 
                        label="Select a resampling rate"
                        description={(<>
                            This process will resample your data before extracting them. Select
                            a sampling rate greater or equal than the maximum sampling rate of your
                            signals (<b>TODO seconds</b>):
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

                { timestampFields && timestampFields.length == 0 && <FormField><Alert type="error">
                    No valid field was found to serve as a timestamp column. This
                    table cannot be used to create a Lookout for Equipment project. 
                </Alert></FormField> }

                { sensors && sensors.length > 0 && <FormField 
                    label="Select a field to filter this table"
                    description="As an option, you can filter this table using one of its field. Only 
                                 fields containing integers and strings can be selected. Use this option
                                 if sensor data from multiple assets or processes are stored in a single
                                 table. Use this field to select which asset or process you want to 
                                 extract the data for:"
                >
                    <Select
                        selectedOption={filterField}
                        onChange={({ detail }) => { 
                            setFilterField({label: detail.selectedOption.value, value: detail.selectedOption.value})
                        }}
                        options={sensors}
                        disabled={sensors.length == 1}
                    />
                </FormField> }

                { measurementOptions && measurementOptions.length > 0 && <FormField 
                    label="Select the sensors" 
                    description="Select the measurements that contain the sensors you want to use to monitor your process or piece of equipment"
                >
                    <Multiselect 
                        selectedOptions={measurementList}
                        onChange={({ detail }) => setMeasurementList(detail.selectedOptions)}
                        options={measurementOptions}
                        placeholder={`Choose measurements ${measurementList.length > 0 ? '(' + measurementList.length + ' selected)' : ''}`}
                        virtualScroll={true}
                        hideTokens={true}
                        filteringType="auto"
                        invalid={errorMessage && measurementList.length == 0}
                    />
                </FormField> }

                { showFlashbar && <Flashbar items={[{
                    type: 'info',
                    loading: true,
                    content: "Launching the extraction and ingestion pipeline: don't navigate away from this page, you will be automatically redirected to your new project dashboard in a few seconds."
                }]} /> }

                { !showFlashbar && measurementOptions && <Alert>
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

export default GlueImport