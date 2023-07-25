// Imports:
import { forwardRef, useContext, useImperativeHandle, useState } from 'react'
import { validateRange } from '../charts/chartUtils'

// Cloudscape components:
import Box from "@cloudscape-design/components/box"
import DateRangePicker from "@cloudscape-design/components/date-range-picker"
import FormField from "@cloudscape-design/components/form-field"
import SpaceBetween from "@cloudscape-design/components/space-between"

// Contexts:
import ModelParametersContext from '../contexts/ModelParametersContext'

// ---------------------
// Component entry point
// ---------------------
const ModelDataRanges = forwardRef(function ModelDataRanges(props, ref) {
    const [value, setValue] = useState(0)
    const { numTrainingDays, totalLabelDuration, trainingRange, numEvaluationDays, evaluationRange } = useContext(ModelParametersContext)
    const x = props.x
    const updateRanges = props.updateRanges
    let totalLabelDurationString = ''

    useImperativeHandle(ref, () => {
        return {
            forceUpdate() {
                setValue(value => value + 1)
            }
        }
    })

    if (totalLabelDuration.current > 0) {
        const totalLabelDays = parseInt(totalLabelDuration.current / 1000 / 86400)
        const daysUnit = totalLabelDays > 1 ? 's' : ''
        const totalHours = parseInt((totalLabelDuration.current - totalLabelDays*86400*1000)/1000/3600)
        totalLabelDurationString = ` including ${totalLabelDays} day${daysUnit} ${totalHours}h in labels` 
    }

    const onTrainingDataRangeChange = () => {
        updateRanges()
        setValue(value => value + 1)
    }

    // Render the component:
    return (
        <SpaceBetween size="xl" direction="horizontal">
            <FormField
                description="Use the slide on top of the above plot to set the training data range or change it manually in the following field"
                label={
                    <SpaceBetween direction='horizontal' size='xs'>
                        Training data range
                        <Box>({numTrainingDays.current}{totalLabelDurationString})</Box>
                    </SpaceBetween>
                }
            >
                <SpaceBetween size="xl" direction="horizontal">
                    <DateRangePicker
                        onChange={onTrainingDataRangeChange}
                        value={trainingRange.current}
                        i18nStrings={{
                            absoluteModeTitle: 'Absolute',
                            applyButtonLabel: 'Apply'
                        }}
                        placeholder="Filter by a date and time range"
                        rangeSelectorMode="absolute-only"
                        isValidRange={(range) => validateRange(range, x)}
                    />
                </SpaceBetween>
            </FormField>

            <FormField
                description="Evaluation range will be automatically updated based on your training range"
                label={
                    <SpaceBetween direction='horizontal' size='xs'>
                        Evaluation data range
                        <Box>({numEvaluationDays.current})</Box>
                    </SpaceBetween>
                }
            >
                <SpaceBetween size="xl" direction="horizontal">
                    <DateRangePicker
                        onChange={({ detail }) => evaluationRange.current = detail.value}
                        value={evaluationRange.current}
                        i18nStrings={{
                            absoluteModeTitle: 'Absolute',
                            applyButtonLabel: 'Apply'
                        }}
                        placeholder="Evaluation range"
                        disabled
                    />
                </SpaceBetween>
            </FormField>
        </SpaceBetween>
    )

})

export default ModelDataRanges