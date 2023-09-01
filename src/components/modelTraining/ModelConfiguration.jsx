// Imports:
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
import FormField    from '@cloudscape-design/components/form-field'
import Input        from '@cloudscape-design/components/input'
import Select       from '@cloudscape-design/components/select'
import SpaceBetween from '@cloudscape-design/components/space-between'

// Contexts
import ModelParametersContext from '../contexts/ModelParametersContext'
import TimeSeriesContext from '../contexts/TimeSeriesContext'
import ApiGatewayContext from '../contexts/ApiGatewayContext'

// App components:
import OffTimeSelection from './OffTimeSelection'

// Utils:
import { getAvailableDefaultModelName } from '../../utils/utils'

function ModelConfiguration() {
    const { data } = useContext(TimeSeriesContext)
    const [ value, setValue ] = useState(0)
    const { datasetName, modelName, selectedSamplingRate, setSelectedSamplingRate } = useContext(ModelParametersContext)
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { projectName } = useParams()

    const samplingRateList = [
        {label: '1 second', value: 'PT1S'},
        {label: '5 seconds', value: 'PT5S'},
        {label: '10 seconds', value: 'PT10S'},
        {label: '15 seconds', value: 'PT15S'},
        {label: '30 seconds', value: 'PT30S'},
        {label: '1 minute', value: 'PT1M'},
        {label: '5 minutes', value: 'PT5M'},
        {label: '10 minutes', value: 'PT10M'},
        {label: '15 minutes', value: 'PT15M'},
        {label: '30 minutes', value: 'PT30M'},
        {label: '1 hour', value: 'PT1H'}
    ]

    useEffect(() => {
        getAvailableDefaultModelName(gateway, uid, projectName)
        .then((x) => {modelName.current = x; setValue(value + 1)})
    }, [gateway])

    // ------------------------------------------------------
    // Once the data is loaded, we can display the component:
    // ------------------------------------------------------
    if (!data.timeseries) {
        return (
            <Alert header="Data preparation in progress">
                Data preparation and ingestion in the app still in progress: after uploading your
                dataset, the app prepares it to optimize visualization speed. This step usually 
                takes 10 to 20 minutes depending on the size of the dataset you uploaded.
            </Alert>
        )
    }
    else if (data) {
        return (
            <SpaceBetween size="xl">
                <FormField
                    description={`Your Lookout for Equipment model name will be built using the current project name (${datasetName.current}) and a suffix, separated by a hyphen ("-") character.`}
                    label="Model name suffix"
                >
                        <Input
                            onChange={({ detail }) => {
                                modelName.current = detail.value
                                setValue(value + 1)
                            }}
                            value={modelName.current}
                            placeholder="Enter a model name"
                        />
                </FormField>

                <FormField
                    description="You can request a resampling of your dataset to reduce training time. Note that high 
                                 value (e.g. 1 hour), may cut out some of the early warning signals of interest. This
                                 will depend on the specific anomaly pattern of interest for your equipment or process."
                    label="Sampling rate"
                >
                    <Select 
                        selectedOption={selectedSamplingRate}
                        onChange={({ detail }) => {
                            setSelectedSamplingRate(detail.selectedOption)
                        }}
                        options={samplingRateList}
                    />

                </FormField>

                <OffTimeSelection />
            </SpaceBetween>
        )
    }
}

export default ModelConfiguration