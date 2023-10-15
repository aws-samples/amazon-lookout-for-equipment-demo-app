// Imports:
import { useState } from 'react'
import { usePapaParse  } from 'react-papaparse'

// CloudScape components:
import Box              from "@cloudscape-design/components/box"
import Button           from "@cloudscape-design/components/button"
import FileUpload       from "@cloudscape-design/components/file-upload"
import FormField        from "@cloudscape-design/components/form-field"
import Modal            from "@cloudscape-design/components/modal"
import SpaceBetween     from "@cloudscape-design/components/space-between"
import Textarea         from "@cloudscape-design/components/textarea"

function UploadLabelsModal({ visible, onDiscard, onUpload, setLabelData }) {
    const [ labelFile, setLabelFile ] = useState([])
    const [ error, setError ] = useState(true)

    return (
        <Modal 
            visible={visible} 
            onDismiss={onDiscard} 
            header="Upload label file"
            footer={
                <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={onDiscard}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={onUpload} disabled={error}>
                            Add labels
                        </Button>
                    </SpaceBetween>
                </Box>
              }
        >

            <FormField label="Label file">
                <SpaceBetween size="xs">
                    <Box>
                        Pick a CSV file from your local computer to upload it.
                    </Box>

                    <CSVUpload
                        onChange={(e) => console.log(e)}
                        value={labelFile}
                        setValue={setLabelFile}
                        setError={setError}
                        setLabelData={setLabelData}
                        constraintText="You store the label data as a CSV file that consists of two columns. The file has no
                                        header. The first column has the start time of the abnormal behavior. The second column
                                        has the end time."
                    />
                </SpaceBetween>
            </FormField>
        </Modal>
    )
}

function CSVUpload({ value, setValue, constraintText, onChange, setError, setLabelData }) {
    const [ preview, setPreview ] = useState(undefined)
    const [ delimiter, setDelimiter ] = useState(undefined)
    const [ linebreak, setLinebreak ] = useState(undefined)
    const [ lines, setLines ] = useState([])
    const [ csvErrors, setCsvErrors ] = useState([])
    const { readString } = usePapaParse()

    function checkDateFormat(labels) {
        let errors = []
        let newText = []

        labels.forEach((label, index) => {
            let currentRow = label.join(delimiter)
            const start = new Date(label[0])
            const end = new Date(label[1])

            if (start.toString() === 'Invalid Date' || end.toString() === 'Invalid Date') {
                errors.push(index)
                currentRow = "(*) " + currentRow
            }
            else if (label.length != 2) {
                errors.push(index)
                currentRow = "(*) " + currentRow
            }

            newText.push(currentRow)
        })

        setPreview(newText.join('\n'))
        setCsvErrors(errors)
        if (errors.length > 0) { setError(true) } else { setError(false) }
    }

    const onUpload = async (e) => {
        if (e.detail && e.detail.value && e.detail.value.length > 0) {
            try {
                const file = e.detail.value[0]
                const fileUrl = URL.createObjectURL(file)
                const response = await fetch(fileUrl)
                const text = await response.text()

                readString(text, {
                    worker: true,
                    complete: (results) => { 
                        setLines(results.data)
                        setDelimiter(results.meta.delimiter)
                        setLinebreak(results.meta.linebreak)
                        checkDateFormat(results.data)
                        setLabelData(results.data)
                    }
                })

                onChange(lines)
            }
            catch (error) {
                console.log(error)
            }
        }

        else if (e.detail && e.detail.value) {
            setPreview("")
            onChange(undefined)
        }
    }

    return (
        <SpaceBetween size="xl">
            <FileUpload
                onChange={async (e) => { 
                    await onUpload(e) 
                    setValue(e.detail.value)
                }}
                value={value}
                i18nStrings={{
                    uploadButtonText: e => "Choose file",
                    removeFileAriaLabel: e => `Remove file ${e + 1}`,
                }}
                showFileLastModified={true}
                showFileSize={true}
                tokenLimit={1}
                constraintText={constraintText}
            />

            { preview && <FormField 
                label="File preview"
                description={
                    `${preview.split('\n').length} label${preview.split('\n').length > 1? "s" : ""} founds
                     (detected delimiter: "${delimiter}")`
                }
            >
                <Textarea
                    value={preview}
                    readOnly={true}
                    invalid={csvErrors.length > 0}
                    rows={preview.split('\n').length > 5 ? 5 : preview.split('\n').length}
                />
                { csvErrors.length > 0 && `Error detected: (*) above denotes lines with errors detected in them. This file should
                                           only contain lines with 2 dates in each row. The file must not include any header or index.` }
            </FormField> }

            
        </SpaceBetween>
    )
}

export default UploadLabelsModal