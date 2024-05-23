Preparing your use case
=======================

Understanding anomaly detection
-------------------------------

In the ever-evolving landscape of industrial operations, the integration of
advanced technologies has become imperative for optimizing efficiency,
minimizing downtime, and ensuring high-quality output. The advent of machine
learning (ML) has paved the way for innovative solutions that empower industries
to proactively address challenges associated with equipment reliability,
maintenance costs, and overall process optimization. 

Historically, industries have relied on reactive maintenance strategies, fixing
equipment issues only after they occur, leading to unplanned downtime and
increased operational costs. However, the paradigm is shifting towards proactive
approaches, where predictive analytics and ML play pivotal roles in anticipating
and preventing failures before they impact production. This shift is driven by
the desire to enhance operational efficiency, reduce maintenance costs, and
improve the overall quality of production output.

Anomaly detection has emerged as a cornerstone of sensor data predictive
analytics, allowing industries to identify irregularities or deviations from
normal operational behavior. One such anomaly detection service is Amazon
Lookout for Equipment, a machine learning solution tailored for industrial
customers. Lookout for Equipment is an ML service for monitoring industrial
equipment that detects abnormal equipment behavior and identifies potential
failures. With Lookout for Equipment, you can augment your predictive
maintenance programs and identify suboptimal industrial processes.

From a machine learning perspective, an anomaly detection engine is a key
component to automate and augment your condition monitoring practice. Condition
monitoring is the first step to provide condition-based maintenance (CBM)
abilities to your users. CBM is a proactive process hinging on two major
activities:, diagnostics and prognostics. Diagnostics is the process of
identification of a failure. Prognostics is the process of forecasting the time
to failure by identifying the deterioration trend of an asset (remaining useful
life estimation). Prognostics has more value than diagnostics. Indeed, with
prognostics, maintenance is scheduled depending on the potential time of failure
estimated. With diagnostics, unscheduled maintenance takes place once a
potential failure is detected. However, prognostics is one of the most
challenging tasks in CBM. Key technical barriers to effective CBM includes the
inability to continually monitor a machine, to identify failures, to recommend
the next best actions and to accurately and reliably predict the remaining
useful life of a machine.

With Amazon Lookout for Equipment, you solve for the first steps of this journey
by enabling the continuous monitoring of your industrial operations and
detection of early warning signals that may lead to failures, unplanned downtime
or quality issues.

Selecting your use case
-----------------------

Lookout for Equipment learns the normal operation condition of your process or
piece of equipment at ingestion time. Based on the time series measurements you
use to describe your operations, it will uncover the major operating modes
captured by your dataset. Then, when the relationships between some of the signals
starts to deviate from this known operating modes (considered as normal), it will
flag this situation as an anomaly.

Knowing this, there are several dimensions to consider to understand which use
cases Lookout for Equipment better fit to:

* Number of assets or processes you want to monitor
* Complexity of the degradation path
* Time horizon between early warnings and actual anomalies
* Types of industrial processes you are operating.

Let's have a look at these different dimensions and how you can leverage Lookout
for Equipment to address anomaly detection-based use cases.

Number of assets vs. degradation path
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

From a business value perspective, the first two dimensions (number of assets
and degradation path) are closely linked together. On the degradation path
perspective, identifying a simple anomalies (outlier visible on a single signal
with the naked eyes) requires less effort than uncovering complex multivariate
early warning signals hidding in the behavior of multiple time series. On the other
hand, monitoring dozens (let alone hundreds or thousands) of assets will require
more effort than focusing on just a handful of assets.

In the following tables, we look at these two dimensions to highlight four
scenarios:

+------------------+-------------------+------------------+
|                  | Complex anomalies | Simple anomalies |
+==================+===================+==================+
| **< 50 signals** | [++]              | [+]              |
+------------------+-------------------+------------------+
| **> 50 signals** | [+++]             | [++]             |
+------------------+-------------------+------------------+

You will get the highest value out Lookout for Equipment if you must monitor a
high number of signals to detect or predict complex anomaly patterns. It can be
thousand of signals on a complex machine (paper mill, gas turbine, several kT
metal forming press...). These machines have multiple components, complex
degradation path, are often critical and maintenance cost is high. Lookout for
Equipment can ingest all these signals and pinpoint the signals that are most
likely to be close to the root cause of the issue saving you investigation time
and helping your engineers establish a diagnostics based on sensors that are
identified as the highest contributors.

If you have complex anomalies on a low number of signals or your anomalies are
simple to detect but you have a large number of assets to monitor at once, the
service will help you scale your monitoring practice. For instance, detecting
simple anomalies across hundreds of pumps scattered in dozens of facilities
would require that your reliability team spend a lot time looking at time series
signals with nothing happening 90% of the time. With Lookout for Equipment you
can package the results into notifications that help you prioritize which assets
should receive your attention first.

Lookout for Equipment tends to be less useful when you have a handful of assets
to monitor with simple anomalies. In this case, it is likely that a simple
rule-based approach with thresholds may suffice to address your monitoring
needs. However, in some situations, this requires some manual work (like
adjusting the threshold from time to time). In this case, taking advantage of
the retraining scheduler of Lookout for Equipment would help automate this work
to let your reliability team focus on diagnostics and preventive tasks.

Time horizon between early warnings and actual anomalies
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Lookout for Equipment is best suited for anomalies that builds over time, with
degradation that happens over the course of hours, days, weeks of more. These
anomalies are hard to spot with a naked eyes and would require someone to know
in advance the scale at which they should look the time sensor data. Mechanical
failures, fatigue break due to gradual wear down, lubrication issues usually
fall in this category.

When failures happen very fast (under a few minutes, seconds or faster), Lookout
for Equipment will only be able to detect the anomaly with a lower chance to
find early warning signals of interest to give you a predictive heads up.
Network, electrical or electronic failures fall in this category. Monitoring
these signals directly to detect these types of failures is unlikely to yield
great results. However, expanding beyond these to include other signals may be
of interest. For instance, if you are interested in failures in electronic
components, some degradation may be linked to the environmental conditions in
which the asset is running. Adding signals from HVAC (temperature,
hygrometry...) may yield interesting correlation with electrical or electronic
defects.

+------------------+-------------------------------------------+-----------------------------------+
| Degradation path | At least several hours                    | Less than a few minutes           |
+==================+===========================================+===================================+
| Outcome          | Can potentially predict and detect issues | Detection only                    |
+------------------+-------------------------------------------+-----------------------------------+

Types of industrial processes
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Industrial operations can usually be classified as discrete, continuous or batch
processes:

* **Continuous**: processes that involve a continuous flow of material going
  through different stages and different equipment. This include many food &
  beverage, chemical or oil & gas downstream production processes.
* **Discrete**: involves the manufacturing of individual objects. Detail parts
  manufacturing for automotive or aerospace industries are example of discrete
  manufacturing processes.
* **Batch**: a batch process is defined as a process that leads to the
  production of a finite quantities of product. For a given recipe, you take
  some raw material, process it and then package the final product. Then you
  take a new batch of raw material and repeat the process. The number of
  different recipes (number of SKUs) will impact the ability of Lookout for
  Equipment to capture relevant anomalies.

The following table highlights the use cases you can try and address with
Lookout for Equipment depending on the data you have access to:

+---------------+------------------------------------------------------------------------------+
| Process types | Use case                                                                     |
+===============+==============================================================================+
| Continuous    | **Predictive maintenance** applications based on machine  data               |
+---------------+------------------------------------------------------------------------------+
|               | **Predictive quality** applications, when applying Lookout for Equipment on  |
|               |                                                                              | 
|               | machine data across multiple pieces of equipment. In this case, you will     |
|               |                                                                              | 
|               | need the product quality output (scrap rate, quality grade, inspection       |
|               |                                                                              | 
|               | results...) to mark the ranges of timeseries that led to a defect.           |
+---------------+------------------------------------------------------------------------------+
| Discrete      | Lookout for Equipment is mostly used for **predictive maintenance** use cases|
|               |                                                                              | 
|               | (e.g.CNC machines operations). The number of different parts that go through |
|               |                                                                              |
|               | the machines of interest. See *Impact of process variability* below.         |
+---------------+------------------------------------------------------------------------------+
|               | **Predictive quality** use cases may also be feasible, if you have access to |
|               |                                                                              |
|               | other input data (raw material grade or recipe) and outputs (quality         |
|               |                                                                              |
|               | inspection results, scrap rate...).                                          |
+---------------+------------------------------------------------------------------------------+
| Batch         | In batch processes failures may be the consequence of something gradually    |
|               |                                                                              |
|               | building up across multiple batches. The ability to address **predictive**   |
|               |                                                                              |
|               | **maintenance** use cases will be impacted to number of recipes processed by |
|               |                                                                              |
|               | a given production line (see *Impact of process variability* below).         |
+---------------+------------------------------------------------------------------------------+
|               | **Predictive quality** use cases may also be feasible, if you have access to |
|               |                                                                              |
|               | other input data (raw material grade or recipe) and outputs (quality         |
|               |                                                                              |
|               | inspection results, scrap rate...).                                          |
+---------------+------------------------------------------------------------------------------+

Required data preprocessing
^^^^^^^^^^^^^^^^^^^^^^^^^^^



Impact of process variability
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Lookout for Equipment learns the normal operating behavior of your assets. When
your data is ingested, at a high level, it is assembled into several clusters.
Whenever a new datapoints appears to be far away of any known clusters it's
marked as an anomaly. If your dataset is linked to a batch process with hundreds
of different recipes or a discrete manufacturing with hundreds of different
paths, there is a high chance that a data point will always be close to a past
cluster.

Of course this depends on the topology of your data in very high dimension space
but as a rule of thumb we have found than having more than 30 different
operating conditions tends to generate a level of noise that makes anomaly
detection very challenging for Lookout for Equipment. We have seen some
customers having some success however by grouping together similar recipes /
parts and building an individual model for each category.