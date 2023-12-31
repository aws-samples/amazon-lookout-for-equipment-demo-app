// CloudScape component:
import Icon from "@cloudscape-design/components/icon"
import Link from "@cloudscape-design/components/link"

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
                        <li>The start and end date of your dataset: note that a minimum of 14 days is currently necessary to train a model</li>
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
        general: {
            header: (<div>Signal overview</div>),
            footer: "",
            body: (
                <div>
                    Once your data is ingested, Amazon Lookout for Equipment will perform a <b>grading</b> of
                    your individual sensor data with regards to their capability to be good quality signals
                    for anomaly detection purpose. The table on this page lets your review the characteristics
                    of each signal: what is the <b>time extent</b> of the signals (start time, end time and 
                    number of days), is there a <b>potential issue</b> embedded in the signal (is it categorical, 
                    monotonic, is there any large gap detected...), how many <b>invalid datapoints</b> were 
                    detected (missing data, duplicate timestamps...), etc.
                </div>
            )
        },

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
        general: {
            header: (<div>Model training</div>),
            footer: "",
            body: (
                <div>
                    <p>
                        Now that your data is ingested, you can train an anomaly detection model using 
                        this page. After training, a model can be deployed to receive fresh data and 
                        provide live analysis. To train your first models, you can use the <b>default 
                        configuration</b>. Once you're more familiar with this application and the 
                        anomalies you want to capture, you will probably want to take the
                        more <b>customized</b> approach. Use the segmentation controls below this
                        page title to switch between the default and the custom configuration view.
                    </p>
                </div>
            )
        },
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
        general: {
            header: (<div>Labeling</div>),
            footer: "",
            body: (
                <div>
                    <p>
                        If you don't know about any historical events of interest in your dataset, feel free to
                        skip this step and go to <b>Model training</b>.
                    </p>

                    <p>
                        Use this page to label your time series data with past historical events. For instance,
                        you may leverage time ranges related to past maintenance records or known failures that
                        are not contingent to normal operating conditions of your equipment or process.
                        Lookout for Equipment only leverages unsupervised approaches and this labeling step
                        is <b>completely optional</b>. Most users start their experimentation with the service
                        without defining any label. Based on the first results, they then iterate to improve
                        the detection capabilities of their model or their forewarning time.
                    </p>
                </div>
            )
        },
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
                        <li>The <b>events detected</b> in the evaluation date range (similar to what you can visualize from the AWS console)</li>
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
        signalDeepDive: {
            header: (<div>Signal deep dive</div>),
            footer: "",
            body: (
                <div>
                    On this section, you will be able to dive deeper into each individual signals used to train the 
                    current model. For each signal you will be able to visualize:

                    <ul>
                        <li>The data used at <b>training time</b> as a time series (in blue)</li>
                        <li>
                            Next, the green line represents the <b>evaluation data</b> The red dots match the timestamps at 
                            which <b>anomalies</b> were detected by the model in this evaluation range. Lastly, the orange
                            plot shows the evolution of the <b>contribution</b> of this specific signal to the detected anomalies.
                        </li>
                        <li>
                            The second plot is a histogram plot showing the distributions of the <b>training data</b> (in blue),
                            of the <b>evaluation data</b> (in green) and of values taken by this specific signal on a timestamp 
                            marked as an <b>anomaly</b> (in red).
                        </li>
                    </ul>

                    These plots will help you get a better understanding of the underlying reasons that Lookout for Equipment have
                    called out a set of anomalies. It will also help you pinpoint the signal behaviors that may be linked to a
                    given anomalous events and accelerate remediation or prevention of a future failure.
                </div>
            )
        }
    },

    // ---------------------------------------------------------------------------------------------------------------------------------
    modelDeployment: {
        general: {
            header: (<div>Model deployment</div>),
            footer: "",
            body: (
                <div>
                    After you've trained a model you can deploy it so that it can process live data and detect anomalies in it. Use 
                    this screen to deploy model that you have previously trained within this project.
                </div>
            )
        }
    },

    // ---------------------------------------------------------------------------------------------------------------------------------
    onlineResults: {
        general: {
            header: (<div>Online monitoring</div>),
            footer: "",
            body: (
                <div>
                    With Amazon Lookout for Equipment, you deploy a model by configuring an inference scheduler. The 
                    latter wakes up on a regular basis, check for new input data, run it by the trained model and store 
                    the results back into an output location on Amazon S3. Use this screen to visualize the results 
                    generated by your schedulers.
                </div>
            )
        },
        detectedEvents: {
            header: (<div>Detected Events</div>),
            footer: "",
            body: (
                <div>
                    This section shows the events detected by your trained model when applied on live data. From top to
                    bottom, you will find:
                    <ul>
                        <li>The <b>events detected</b> in the live date range processed by the inference scheduler</li>
                        <li>A <b>slider</b> to zoom on the part of interest on the plots</li>
                        <li>
                            The raw anomaly score emitted by your model: the detected events are also overlaid on this 
                            plot. Any time the raw anomaly score goes above 0.5, Lookout for Equipment marks the timestamp
                            as an anomaly and computes the associated sensor contribution. This plot is color coded to help
                            you visualize the severity of a given anomaly range:
                            <ul>
                                <li><b><span style={{color: "#67a353"}}>Green</span></b> when the anomaly score is &lt; 0.5</li>
                                <li><b><span style={{color: "#e07941"}}>Orange</span></b> when 0.5 &lt; anomaly score &lt; 0.9 </li>
                                <li><b><span style={{color: "#a32952"}}>Red</span></b> when the anomaly score is &gt; 0.9</li>
                            </ul>
                        </li>
                        <li>
                            The <b>sensor contribution</b> evolution over time. When Lookout for Equipment identifies a given time range
                            as an anomaly, it also computes the sensor contribution to this event. Each sensor receives a level of
                            contribution between 0% and 100%. By default, the top 5 contributors are highlighted: use the <b>legend</b> on the
                            right to adjust this display. Sensor contributions are only computed when the raw anomaly score for a
                            given timestamp is greater than 0.5
                        </li>
                        <li>The <b>time series</b> plots of the selected sensors: this will help you put the anomalies in context.</li>
                    </ul>
                </div>
            )
        },
        signalDeepDive: {
            header: (<div>Signal deep dive</div>),
            footer: "",
            body: (
                <div>
                    On this section, you will be able to dive deeper into each individual signals used to train the 
                    current model. For each signal you will be able to visualize:

                    <ul>
                        <li>The data used at <b>training time</b> as a time series (in blue)</li>
                        <li>
                            In the middle, the green line represents the <b>live data</b> collected and sent to the model 
                            to detect if some anomalies are present. The red dots match the timestamps at which <b>anomalies</b>
                            were detected by the model. Lastly, the orange plot shows the evolution of the <b>contribution</b>
                            for this specific signal.
                        </li>
                        <li>
                            The third plot is a histogram plot showing the distributions of the <b>training data</b> (in blue),
                            of the <b>live data</b> (in green) and of values taken by this specific signal on a timestamp marked as an
                            <b>anomaly</b> (in red).
                        </li>
                    </ul>

                    These plots will help you get a better understanding of the underlying reasons that Lookout for Equipment have
                    called out a set of anomalies. It will also help you pinpoint the signal behaviors that may be linked to 
                    a given anomalous events and accelerate remediation or prevention of a future failure.
                </div>
            )
        }
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