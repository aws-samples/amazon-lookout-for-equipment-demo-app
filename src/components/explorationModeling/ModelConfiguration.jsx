// Imports:
import { useContext, useState } from 'react'

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
import FormField    from '@cloudscape-design/components/form-field'
import Input        from '@cloudscape-design/components/input'
import Select       from '@cloudscape-design/components/select'
import SpaceBetween from '@cloudscape-design/components/space-between'

// Contexts
import ModelParametersContext from '../contexts/ModelParametersContext'
import TimeSeriesContext from '../contexts/TimeSeriesContext'

// App components:
import OffTimeSelection from './OffTimeSelection'

function ModelConfiguration() {
    const { data } = useContext(TimeSeriesContext)
    const [ value, setValue ] = useState(0)
    const { datasetName, modelName } = useContext(ModelParametersContext)

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
                    description={`Your Lookout for Equipment model name will be built using the current asset name (${datasetName.current}) and a suffix, separated by a hyphen ("-") character.`}
                    label="Model name suffix"
                >
                    <Input
                        onChange={({ detail }) => {
                            modelName.current = detail.value
                            setValue(value => value + 1)
                        }}
                        value={modelName.current}
                        placeholder="Enter a model name"
                    />
                </FormField>

                <OffTimeSelection />
            </SpaceBetween>
        )
    }
}

export default ModelConfiguration