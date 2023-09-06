// CloudScape component:
import Box from "@cloudscape-design/components/box"
import Icon from "@cloudscape-design/components/icon"
import Link from "@cloudscape-design/components/link"
import SpaceBetween from "@cloudscape-design/components/space-between"

// Contains all the help panel contents:
export const helpPanelContent = {
    // ---------------------------------------------------------------------------------------------------------------------------------
    createProject: {
        dataset: {
            header: (<div>Dataset format</div>),
            footer: (
                    <ExternalLinkGroup
                        items={[{ 
                            href: 'https://docs.aws.amazon.com/lookout-for-equipment/latest/ug/formatting-data.html', 
                            text: 'Formatting your data for Lookout for Equipment' 
                        }]}
                    />
            ),
            body: (
                <div>
                    <p>
                        To monitor your equipment or industrial process, you must provide Amazon Lookout for Equipment 
                        with time series data from the sensors on your equipment or process. To provide these time series,
                        you must use properly formatted .csv files to create a dataset. Although Lookout for Equipment
                        accepts a broader set of configuration, this application only allow you to upload a single CSV
                        file for the time being. Arrange your data using this format:
                    </p>

                    <p><code>
                        Timestamp,Sensor 1,Sensor 2<br />
                        2020/01/01 00:00:00,2,12<br />
                        2020/01/01 00:05:00,3,11<br />
                        2020/01/01 00:10:00,5,10<br />
                        2020/01/01 00:15:00,3,16<br />
                        2020/01/01 00:20:00,4,12<br />
                    </code></p>

                    <p>
                        You can choose your column names. We recommend using "Timestamp" as the name for the column with the 
                        time series data. Check the documentation (link below) for the allowed formats of the timestamp column.
                    </p>

                    <p>
                        You must have a double (numerical) as the data type for your sensor data. You can only train your model 
                        on numeric data. The valid characters that you can use in the column names of the dataset are A-Z, a-z, 
                        0-9, . (dot), _ (underscore) and - (hyphen).
                    </p>
                </div>
            )
        }
    },

    // ---------------------------------------------------------------------------------------------------------------------------------
    projectDashboard: {
        summary: {
            header: (<div>Summary section</div>),
            footer: "",
            body: (
                <div>
                    You can use this screen to verify that your dataset was correctly ingested and that 
                    its content is aligned with your expectations. Use the <b>summary</b> section to double
                    check the following items:
                    <ul>
                        <li>The start and end date of your dataset: note that a minimum of 90 days is currently necessary to train a model</li>
                        <li>The number of attributes found in the CSV file your uploaded when your project was created</li>
                        <li>The number of rows found in the dataset</li>
                    </ul>
                </div>
            )
        },
        datasetOverview: {
            header: (<div>Dataset overview</div>),
            footer: "",
            body: (
                <div>
                    Expand the <b>Dataset overview</b> section to verify the following items:
                    
                    <ul>
                        <li>The name of your columns (your sensors)</li>
                        <li>The format of the data in each column: currently this application will only leverage numeric columns</li>
                        <li>The format of the timestamp in the first column</li>
                    </ul>
                    
                    If something seems odd, you can use the <b>Delete project</b> button to remove
                    it from this application: this will also remove any related asset (such as models and
                    deployments).
                </div>
            )
        },
    },

    // ---------------------------------------------------------------------------------------------------------------------------------
    sensorOverview: {
        signalGradingTable: {
            header: (<div>Signal grading</div>),
            footer: (
                <ExternalLinkGroup
                    items={[{ 
                        href: 'https://docs.aws.amazon.com/lookout-for-equipment/latest/ug/reading-details-by-sensor.html', 
                        text: 'Evaluating sensor grades' 
                    }]}
                />
            ),
            body: (
                <div>
                    Once your data is ingested, Amazon Lookout for Equipment will perform a <b>grading</b> of
                    your individual sensor data with regards to their capability to be good quality signals
                    for anomaly detection purpose. The following table lets your review the characteristics
                    of each signal:

                    <ul>
                        <li>What is the <b>time extent</b> of the signals (start time, end time and number of days)</li>
                        <li>
                            Is there a <b>potential issue</b> embedded in the signal (is it categorical, monotonic, is
                            there any large gap detected...).
                        </li>
                        <li>
                            How many <b>invalid datapoints</b> were detected (missing data, duplicate timestamps...)
                        </li>
                    </ul>
                </div>
            )
        },

        timeseriesPlot: {
            header: (<div>Signal time series plot</div>),
            footer: "",
            body: (
                <div>
                    You can <b>visually review</b> the behavior of a selected signal by looking at its time series
                    plot. This plot will help you understand why the grading table mentions large gaps, missing data,
                    monotonic behavior or multiple operating modes. At the top right of this plot you will also find
                    two icons:

                    <ul>
                        <li>
                            
                            The first one (<img src="/icon-select-range.png" width="16px" />) will let you <b>horizontally 
                            select</b> a range on your time series. This range will be highlighted in green. Selecting a 
                            range will update the histogram plot on the right to display two distributions. One, for the 
                            selected data (with a green histogram) and one for the remaining data (with a blue histogram).
                        </li>
                        <li>
                            The second icon (<img src="/icon-select-clear.png" width="16px" />) will <b>clear</b> the time
                            range selection.
                        </li>
                    </ul>
                </div>
            )
        },

        histogramPlot: {
            header: (<div>Signal histogram plot</div>),
            footer: "",
            body: (
                <div>
                    You can also <b>visually review</b> the behavior of a selected signal by looking at the distribution
                    of the values it takes over time. This plot will help you understand why the grading table mentions
                    multiple operating modes (which will be visible as multiple peaks in the histogram). When you use
                    the range selection icon (<img src="/icon-select-range.png" width="16px" />) at the top of the time
                    series plot, you will create a split of the histogram and two distributions will be shown:

                    <ul>
                        <li>A green one showing the distribution of the selected values</li>
                        <li>A blue one showing the distribution of the remaining values</li>
                    </ul>

                    When you train a model, you will have to select which portion of your historical data will be used
                    to train an anomaly detection model. Selecting a training range that showcases a significant shift
                    with regards of the remaining data may lead to lower quality models which yield more false positives.
                    Using this feature, helps you understand if this may happen with your data and help you mitigate this
                    risk by selecting an appropriate training range.
                </div>
            )
        }
    },

    // ---------------------------------------------------------------------------------------------------------------------------------
    modelTraining: {
        wizardTrainingDataRange: {
            header: (<div>Training data range</div>),
            footer: "",
            body: (
                <div>
                    <p>
                        To train a model, you can select part of the historical data that you ingested. Ideally, you should
                        select a training range that mostly focuses on the normal operating conditions your pieces of equipment
                        or process went through.
                    </p>

                    <p>
                        To highlight a training range, use the slider at the top of the chart:<br />
                        <img src="/help-training-range.gif" width="220px" />
                        The training data ranges will be updated live while you use the slider to let
                        you precisely define your start and end dates.
                    </p>

                    <p>
                        <b>Note:</b> <i>although Lookout for Equipment can deal with a moderate level of actual anomalies present in the training
                        range, a large amount of anomalies will negatively impact the relevance of the model trained: similar 
                        anomalies happening in live production may not be captured. To reduce this risk, you can use the labelling
                        screen of this application and use the labels identified it in step 3 of this wizard.</i>
                    </p>
                </div>
            )
        },
        wizardSignalSelection: {
            header: (<div>Signal selection</div>),
            footer: "",
            body: (
                <div>
                    <p>
                        Select the signals you want to use to train your model. By default, all the signals are 
                        selected. You can use the controls at the top of the page to filter and navigate through
                        the signals included in your dataset.
                    </p>

                    <p>
                        Each signal is described in a card the includes the following information to help you
                        with your selection:
                        <ul>
                            <li>The name of the signal</li>
                            <li>
                                The potential issues found by Lookout for Equipment at ingestion time. These 
                                issues are also summarized in the <b>Sensor overview</b> page of this application.
                            </li>
                            <li>
                                The start and end time of the data available for this signal: when comparing with
                                the training data range selected at the previous step, this will help you identify
                                if a given signal may have too many missing values to be relevant.
                            </li>
                            <li>
                                A time series plot to help you visualize your signals: to train a good anomaly detection
                                model, you should avoid (mostly) constant signals, signals that are monotonic (always
                                increasing or decreasing) or categorical (with just a few different values across the desired
                                time range). Some signals may show different operating modes across the training data range:
                                when possible, try and select a training range that encompasses all the normal operation 
                                conditions. Leaving a mode out, may generate an increase level of false positives when 
                                the model tackles new data.
                            </li>
                            <li>
                                The training range is highlighted in green over each time series data:
                                <img src="/help-timeseries.png" width="220px" />
                            </li>
                            <li>
                                You can also visualize the distributions of the values taken by each individual sensors. Two
                                histograms are shown: a green one with the values the signals takes during the selected
                                training data range and another one with the remaining values. If these distributions are 
                                very different (as the example below showcase), your model may generate too many false 
                                positives to be relevant:

                                <img src="/help-histograms.png" width="220px" />
                            </li>
                        </ul>
                    </p>
                </div>
            )
        },
        wizardLabels: {
            header: (<div>Labels</div>),
            footer: "",
            body: (
                <div>
                    <p>
                        You can create a group of labels in the <b>Labelling</b> page of this application. Once defined,
                        all your label groups will be listed under the <b>Select labels</b> drop down. Selecting a
                        label group will display your time series and overlay the defined labels, to let you review
                        how relevant they are for your model before you train it.
                    </p>

                    <p>
                        Lookout for Equipment only leverages unsupervised approaches: labels are not mandatory and can
                        be tackled as an iteration to improve your first models, or after you've confirmed some anomalies
                        detected in your live data after deployment.
                    </p>
                </div>
            )
        },
        wizardOtherParameters: {
            header: (<div>Other parameters</div>),
            footer: "",
            body: (
                <div>
                    <p>
                        On this page you will be able to finalize your model by:
                        <ul>
                            <li>Giving it a name if the default one does not suit you</li>
                            <li>Adjust the rate to be used to resample your data at training time</li>
                            <li>Define a signal to use for off time detection</li>
                        </ul>
                    </p>
                </div>
            )
        },
        wizardSamplingRate: {
            header: (<div>Sampling rate</div>),
            footer: "",
            body: (
                <div>
                    <p>
                        The selected <b>Sampling rate</b> will have an impact on the training time. A 10-seconds sampling
                        rate will require more training time than a 1-hour sampling rate. However, a high sampling rate
                        (e.g. 1 hour) may cut off the early warning signals of interest that lay in the highest frequency
                        domains of your signals.
                    </p>
                </div>
            )
        },
        wizardOffTimeDetection: {
            header: (<div>Off time detection</div>),
            footer: "",
            body: (
                <div>
                    <p>
                        Sometime, your process or piece of equipment may be off or not running: 
                        using the data collected during these time ranges is not relevant and you may want to discard them 
                        automatically.
                    </p>

                    <p>
                        Lookout for Equipment gives you the opportunity to use of your selected signals as 
                        an off time detector. For instance, a rotating equipment may be considered off if the rotation speed
                        is less than 10 RPM.
                    </p> 

                    <p>
                        Use the signal drop down to select the one to use for off time detection purpose.
                        A time series plot for this signal will be shown. Drag and drop the red thick like to position the 
                        threshold or adjust it manually:
                    </p>
                    <p>
                        <img src="/help-off-time-selection.gif" width="220px" />
                    </p>
                </div>
            )
        },
    },

    // ---------------------------------------------------------------------------------------------------------------------------------
    labelling: {
        selectLabelGroup: {
            header: (<div>Label groups list</div>),
            footer: "",
            body: (
                <div>
                    <p>
                        Once you start defining label groups for the current project, this dropdown will
                        list them all. Select one of the label groups to bring the associated labels up. A label group
                        cannot be modified (as it can be associated to a trained model): when you select
                        a label group using this dropdown, you will only be able to visualize the associated
                        labels over your time series data.
                    </p>

                    <p>
                        You can also delete an existing label group: this will ask for your confirmation.
                        Deleting a label group is not permitted if it has already been used to train an existing
                        model. The models that uses a given label group will be listed when you try to delete
                        it.
                    </p>
                </div>
            )
        },
        selectLabelGroupReadOnly: {
            header: (<div>Label groups list</div>),
            footer: "",
            body: (
                <div>
                    <p>
                        If you have defined some label groups in the labeling screen, this dropdown will
                        list them all. Select one of the label groups to use it. It will also bring the 
                        associated labels up and display them for visualization purpose on your time series
                        signals overview.
                    </p>
                </div>
            )
        },
        labelGroupName: {
            header: (<div>Label group name</div>),
            footer: "",
            body: (
                <div>
                    <p>
                        You can give a name to your label group. The valid characters that you can use in 
                        for your label group name are A-Z, a-z, 0-9, _ (underscore) and - (hyphen).
                    </p>
                </div>
            )
        },
        signalOverview: {
            header: (<div>Signal overview</div>),
            footer: "",
            body: (
                <div>
                    Use the signal overview chart to visualize your time series and identify where you would
                    like to add some labels. At the top right of this plot you will find three icons to help
                    you in this task:

                    <ul>
                        <li>
                            The first one (<img src="/icon-select-range.png" width="16px" />) will let you <b>horizontally 
                            select</b> a range on your time series. This range will be highlighted in green. Selecting a 
                            range will update the labels table located below the chart.
                        </li>
                        <li>
                            The second icon (<img src="/icon-select-multiple.png" width="16px" />) will <b>enable multiple 
                            selections</b>, letting you drag your mouse pointer multiple times to define several label ranges.
                        </li>
                        <li>
                            The third icon (<img src="/icon-select-clear.png" width="16px" />) will <b>clear</b> the time
                            range selections and the labels table.
                        </li>
                    </ul>

                    <p>
                        <img src="/help-labelling.gif" width="220px" />
                    </p>

                    <p>
                        Note that these tools are only available when you create a new group and want to define labels. They
                        are not available when reviewing an existing label group.
                    </p>
                </div>
            )
        },
        labelsTable: {
            header: (<div>Labels table</div>),
            footer: "",
            body: (
                <div>
                    <p>
                        This tables lists all the labels you defined in the signal overview plot above. For
                        each label, you will get a precise start and end date along with its duration.
                    </p>
                </div>
            )
        }
    },

    // ---------------------------------------------------------------------------------------------------------------------------------
    offlineResults: {
        modelOverview: {
            header: (<div>Model overview</div>),
            footer: "",
            body: (
                <div>
                    <p>
                        Once a model is trained you can use the <b>Model overview</b> section to visualize the parameters 
                        used for training.
                    </p>
                    
                    <p>
                        From this screen you can also <b>Delete</b> a model that you don't need anymore.
                        This action will also stop and delete any inference scheduler configured with this model.
                    </p>
                </div>
            )
        },
        detectedEvents: {
            header: (<div>DetectedEvents</div>),
            footer: "",
            body: (
                <div>
                    This section shows the evaluation results of your model when applied on historical data you selected at 
                    training time. From top to bottom, you will find:
                    <ul>
                        <li>The <b>events detected</b> in the evaluation date range (similar to what you can visualize from the AWS console</li>
                        <li>A <b>slider</b> to zoom on the part of interest on the plots</li>
                        <li>
                            The <b>detected events aggregated by day</b>: this plot can be more useful than the raw events 
                            detected as it helps filtering out short-lived events that may be considered false positives.
                        </li>
                        <li>
                            The <b>sensor contribution</b> evolution over time. When Lookout for Equipment identifies a given time range
                            as an anomaly, it also computes the sensor contribution to this event. Each sensor receives a level of
                            contribution between 0% and 100%. By default, the top 5 contributors are highlighted: use the <b>legend</b> on the
                            right to adjust this display.
                        </li>
                        <li>The <b>time series</b> plots of the selected sensors</li>
                    </ul>
                </div>
            )
        },
    }
}

// -----------------------------------------------
// Displays a list of external links, usually put 
// in the footer of the help panel to lead to more 
// details
// -----------------------------------------------
function ExternalLinkGroup ({ items }) {
    return (
        <>
            <h3>
                Learn more  <Icon name="external" size="inherit" />
            </h3>
            <ul>
                {items.map((item, index) => (
                    <li key={index}>
                        <Link href={item.href} target="_blank">
                            {item.text}
                        </Link>
                    </li>
                ))}
            </ul>
        </>
    )
}