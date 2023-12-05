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
import { waitForPipelineStart } from '../../utils/utils.js'
import { 
    checkProjectNameValidity, 
    checkAssetDescriptionValidity,
    getAllDatabases,
    getAllTables,
    getTableInfos,
    getAllDimensionItems,
    getTimeRange,
    getSamplingRate
} from './createProjectUtils.js'

// --------------------------
// Component main entry point
// --------------------------
const TimestreamImport = forwardRef(function TimestreamImport(props, ref) {
    // Component state definition:
    const projectName         = props.projectName
    const assetDescription    = props.assetDescription
    const setUploadInProgress = props.setUploadInProgress
    const setErrorMessage     = props.setErrorMessage
    const errorMessage        = props.errorMessage
    const setAssetError       = props.setAssetError

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
    const [ minStartDate, setMinStartDate ]             = useState(undefined)
    const [ maxEndDate, setMaxEndDate ]                 = useState(undefined)
    const [ signalSamplingRate, setSignalSamplingRate ] = useState(undefined)
    const [ unloadSamplingRate, setUnloadSamplingRate ] = useState(undefined)
    const [ assetLoading, setAssetLoading ]             = useState("")
    const [ showFlashbar, setShowFlashbar ]             = useState(false)

    const { gateway, uid, navbarCounter, setNavbarCounter } = useContext(ApiGatewayContext)
    const navigate = useNavigate()

    // Collect user credentials
    useEffect(() => {
        Auth.currentUserCredentials()
        .then((credentials) => setIdentityId(credentials.identityId))
    })
    
    // This function is called by the parent component to trigger the import:
    useImperativeHandle(ref, () => ({
        async processTimestreamImport() {
            let currentError = ""
            let timestreamConnectionDefined = database && table && dimension && 
                                              sensors && asset && unloadSamplingRate
    
            // Error checking:
            let { error, errorMessage } = await checkProjectNameValidity(projectName, undefined, gateway, uid)
            if (error) {
                currentError = errorMessage
            }
            else if (checkAssetDescriptionValidity(assetDescription, setAssetError)) {
                currentError = 'Asset / process description is invalid'
            }
            else if (!timestreamConnectionDefined) {
                currentError = 'Timestream connection is not fully configured'
            }
            else if (sensors.length == 0) {
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
                { databasesList.length > 0 && <FormField 
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
                </FormField> }

                { databasesList.length == 0 && <Alert type="warning">
                    No Timestream database found.
                </Alert> }

                {/* ----------------------------------------------------------------------
                    Once the database is selected, we let the user selects the right table
                    ---------------------------------------------------------------------- */}
                { tablesList && tablesList.length > 0 && <FormField label="Select a Timestream table">
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

                { tablesList && tablesList.length == 0 && <Alert type="warning">
                    No Timestream table found in this database.
                </Alert> }

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
                            setMinStartDate(startDate.toISOString().slice(0, 10))
                            setExportEndDate(endDate.toISOString().slice(0, 10))
                            setMaxEndDate(endDate.toISOString().slice(0, 10))

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
                    { exportStartDate !== undefined && <SpaceBetween size="xl">
                        <FormField 
                            label="Time range" 
                            description={(<>The available data for this asset (<b>{asset.value}</b>) ranges from <b>{minStartDate}</b>&nbsp;
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
                                    invalid={errorMessage && sensors.length == 0}
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

                    { exportStartDate === undefined && <Spinner /> }
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