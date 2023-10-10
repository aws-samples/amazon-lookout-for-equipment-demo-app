// Imports
import { useContext, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createModel } from './modelTrainingUtils'

// App components:
import MultivariateTimeSeriesChart from '../charts/MultivariateTimeSeriesChart'
import ModelingSignalSelection     from './ModelingSignalSelection'
import ModelConfiguration          from './ModelConfiguration'
import ReviewModelConfiguration    from './ReviewModelConfiguration'
import LabelsManagement            from '../labelling/LabelsManagement'

// Contexts:
import ModelParametersContext from '../contexts/ModelParametersContext'
import ApiGatewayContext from '../contexts/ApiGatewayContext'
import HelpPanelContext from '../contexts/HelpPanelContext'
import { LabelingContextProvider } from '../contexts/LabelingContext'

// CloudScape Components:
import Link             from "@cloudscape-design/components/link"
import SegmentedControl from "@cloudscape-design/components/segmented-control"
import Wizard           from "@cloudscape-design/components/wizard"

// --------------------
// Component definition
// --------------------
function CustomModelConfig({ trainingConfig, setTrainingConfig }) {
    const [ activeStepIndex, setActiveStepIndex ] = useState(0)
    const [ errorMessage, setErrorMessage ] = useState(undefined)
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { setHelpPanelOpen } = useContext(HelpPanelContext)
    const { 
        trainingRange, 
        evaluationRange, 
        selectedItems, 
        datasetName, 
        modelName,
        selectedOption,
        selectedSignal,
        offConditionValue,
        selectedLabelGroupName,
        selectedSamplingRate
    } = useContext(ModelParametersContext)
    const navigate = useNavigate()

    const wizardSteps = [
        {
            title: "Training data range",
            description: (<>
                <SegmentedControl
                    selectedId={trainingConfig}
                    onChange={({ detail }) => setTrainingConfig(detail.selectedId) }
                    label="Default segmented control"
                    options={[
                        { text: "Default configuration", id: "default" },
                        { text: "Custom configuration", id: "custom" }
                    ]}
                />
                <p>Start by defining training and (optionally), the evaluation range of your model</p>
                </>
            ),
            info: 
                <Link variant="info" onFollow={() => setHelpPanelOpen({
                    status: true,
                    page: 'modelTraining',
                    section: 'wizardTrainingDataRange'
                })}>Info</Link>,
            content: <MultivariateTimeSeriesChart 
                showLegend={true} 
                showToolbox={false} 
                componentHeight={350}
                enableBrush={false}
            />
        },
        {
            title: "Signal selection",
            info: 
                <Link variant="info" onFollow={() => setHelpPanelOpen({
                    status: true,
                    page: 'modelTraining',
                    section: 'wizardSignalSelection'
                })}>Info</Link>,
            description: "Select the signals to be used to train this model",
            content: <ModelingSignalSelection />
        },
        {
            title: "Labels",
            info: 
                <Link variant="info" onFollow={() => setHelpPanelOpen({
                    status: true,
                    page: 'modelTraining',
                    section: 'wizardLabels'
                })}>Info</Link>,
            description: `You may use an existing group of labels that Lookout for Equipment will
                          leverage to identify periods of time to discard from the normal operating
                          conditions of your process or asset. In addition, these labels will be
                          used to select the best model configuration for your dataset.`,
            content: 
                <LabelingContextProvider>
                    <LabelsManagement readOnly={true} />
                </LabelingContextProvider>
            ,
            isOptional: true
        },
        {
            title: "Other parameters",
            info: 
                <Link variant="info" onFollow={() => setHelpPanelOpen({
                    status: true,
                    page: 'modelTraining',
                    section: 'wizardOtherParameters'
                })}>Info</Link>,
            description: `On this last page, you can name your model or select a rate to resample your
                          data. You can also select a signal that Lookout for Equipment will use to
                          identify when your piece of equipment or your process is not running.`,
            content: <ModelConfiguration />
        },
        {
            title: "Review and create",
            description: `Review your model parameters. Fields with invalid values will be marked in 
                          red: you can navigate the other pages of this wizard to address any issue
                          before creating your model.`,
            content: <ReviewModelConfiguration errorMessage={errorMessage} />
        }
    ]

    return (
        <Wizard
            activeStepIndex={activeStepIndex}
            allowSkipTo={true}
            steps={wizardSteps}

            i18nStrings={{
                stepNumberLabel: (stepNumber) => `Step ${stepNumber}`,
                collapsedStepsLabel: (stepNumber, stepsCount) => `Step ${stepNumber} of ${stepsCount}`,
                skipToButtonLabel: (step, stepNumber) => `Skip to ${step.title}`,
                navigationAriaLabel: "Steps",
                cancelButton: "Cancel",
                previousButton: "Previous",
                nextButton: "Next",
                submitButton: "Create model",
                optional: "optional"
            }}

            onCancel={() => setTrainingConfig('default')}
            onNavigate={({ detail }) => setActiveStepIndex(detail.requestedStepIndex)}
            onSubmit={(e) => createModel(
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
                                setErrorMessage
                            )}
        />
    )
}

export default CustomModelConfig