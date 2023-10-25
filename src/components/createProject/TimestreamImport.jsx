// Imports:
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react'

// Cloudscape components:
import Box from "@cloudscape-design/components/box"
import Button from "@cloudscape-design/components/button"
import FormField from "@cloudscape-design/components/form-field"
import Multiselect from "@cloudscape-design/components/multiselect"
import Select from "@cloudscape-design/components/select"
import Spinner from "@cloudscape-design/components/spinner"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Textarea from "@cloudscape-design/components/textarea"

// Contexts:
import ApiGatewayContext from '../contexts/ApiGatewayContext.jsx'

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
    const query = `SHOW MEASURES FROM "${databaseName}"."${tableName}"`

    const response = await gateway.timestream
                                  .query(query)
                                  .catch((error) => console.log(error))

    let sensorsList = []
    let dimensionsList = []

    if (response.Rows.length > 0) {
        response.Rows.forEach((row) => {
            sensorsList.push(row.Data[0].ScalarValue)

            if (dimensionsList.length == 0) {
                row.Data[2].ArrayValue.forEach((dimension) => {
                    dimensionsList.push(dimension.RowValue.Data[0].ScalarValue)
                })
            }
        })
    }
    
    return { 
        sensorsList: sensorsList,
        dimensionsList: dimensionsList
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
        console.log(response.Rows)
        response.Rows.forEach((row) => {
            assetsList.push({label: row.Data[0].ScalarValue, value: row.Data[0].ScalarValue})
        })
    }

    return assetsList
}

// --------------------------
// Component main entry point
// --------------------------
const TimestreamImport = forwardRef(function TimestreamImport(props, ref) {
    // Component state definition:
    const projectName         = props.projectName
    const assetDescription    = props.assetDescription

    const { gateway, uid } = useContext(ApiGatewayContext)

    const [ databasesList, setDatabasesList ] = useState(undefined)
    const [ tablesList, setTablesList ] = useState(undefined)
    const [ dimensionsOptions, setDimensionsOptions ] = useState(undefined)
    const [ tagsOptions, setTagsOptions ] = useState(undefined)
    const [ assetsList, setAssetsList ] = useState(undefined)

    const [ database, setDatabase ] = useState(undefined)
    const [ table, setTable ] = useState(undefined)
    const [ dimension, setDimension ] = useState(undefined)
    const [ sensors, setSensors ] = useState(undefined)
    const [ asset, setAsset ] = useState(undefined)

    const [ assetLoading, setAssetLoading ] = useState("")

    // This function is called by the parent component to trigger the import:
    useImperativeHandle(ref, () => ({
        async processTimestreamImport() {
            console.log('Start Timestream import')
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
                // setAssetListControl((
                //     <Select 
                //         selectedOption={asset}
                //         onChange={({ detail }) => {
                //             console.log(detail)
                //             setAsset(detail.selectedOption)
                //         }}
                //         options={x}
                //         placeholder="Select an asset"
                //     />
                // ))
            })
        }
    }, [gateway, dimension])

    // Render the component:
    let children = undefined
    if (databasesList) {
        let sensorsList = []
        if (sensors) {
            for (const s of sensors) {
                sensorsList.push('- ' + s.label)
            }
        }
        sensorsList = sensorsList.join('\n')

        children = (
            <SpaceBetween size="xl">
                <FormField label="Select a Timestream database">
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

                { tablesList && <FormField label="Select a Timestream table">
                    <Select 
                        selectedOption={table}
                        onChange={async ({ detail }) => { 
                            setTable(detail.selectedOption)
                            const { sensorsList, dimensionsList } = await getTableInfos(gateway, database.value, detail.selectedOption.value)

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

                { dimensionsOptions && <FormField 
                    label="Select a dimension" 
                    description="Select the dimension that contain the IDs of your processes or pieces of equipment to be monitored"
                    secondaryControl={
                        <Select 
                            selectedOption={asset}
                            onChange={({ detail }) => {
                                setAsset(detail.selectedOption)
                            }}
                            options={assetsList}
                            placeholder="Select an asset"
                            statusType={assetLoading}
                        />
                    }
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
                </FormField>}

                { tagsOptions && <SpaceBetween size="xl">
                    <FormField 
                        label="Select the sensors" 
                        description="Select the measurements that contain the sensors you want to use to monitor your processe or piece of equipment"
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

                    <FormField label="Selected measurements">
                        <Textarea
                            value={sensorsList}
                            readOnly={true}
                            rows={sensors.length > 10 ? 10 : sensors.length}
                        />
                    </FormField>
                </SpaceBetween> }
            </SpaceBetween>
        )
    }
    else {
        children = <Spinner />
    }

    return children
})

export default TimestreamImport