import { forwardRef, useImperativeHandle, useState } from 'react'

const GlueImport = forwardRef(function GlueImport(props, ref) {
    return (<div>
        Glue import form
        <ul>
            <li>Select an AWS Glue data catalog database</li>
            <li>Select a table</li>
            <li>
                Select a field to filter the data to extract:
                <ul>
                    <li>No filter</li>
                    <li>Field 1</li>
                    <li>Field 2</li>
                    <li>Field 3</li>
                    <li>...</li>
                </ul>
            </li>
            <li>If a field a selected, select a value to filter the extract</li>
            <li>
                Available data for this asset ranges from... to ...
                Select the range you would like to export
            </li>
            <li>Select the field with timestamp</li>
            <li>Select a range to extract information</li>
            <li>Select the measurements that contain the sensors you want to use to monitor your process or piece of equipment</li>
            <li>Select a resampling rate</li>

            Launching the extraction and ingestion pipeline: don't navigate away from this page, you will be automatically 
            redirected to your new project dashboard in a few seconds.
        </ul>
    </div>)
})

export default GlueImport