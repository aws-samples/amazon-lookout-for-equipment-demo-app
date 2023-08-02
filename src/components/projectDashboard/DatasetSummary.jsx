// Cloudscape components:
import Box               from "@cloudscape-design/components/box"
import ColumnLayout      from "@cloudscape-design/components/column-layout"
import Container         from "@cloudscape-design/components/container"
import ExpandableSection from "@cloudscape-design/components/expandable-section"
import Header            from "@cloudscape-design/components/header"
import SpaceBetween      from "@cloudscape-design/components/space-between"

// App components:
import DatasetOverview from './DatasetOverview'

function DatasetSummary({ modelDetails }) {
    // Compute the sampling rate and build a
    // human-readable version with the units:
    const SamplingRate = () => {
        if (modelDetails) {
            const numRows = parseFloat(modelDetails.rowCounts.Table.ItemCount)
            const endDate = new Date(modelDetails.endDate).getTime() / 1000
            const startDate = new Date(modelDetails.startDate).getTime() / 1000
            const samplingRate = ((endDate - startDate)/numRows).toFixed(1)

            if (modelDetails) {
                return (
                    <>
                        <div>{samplingRate} seconds</div>
                    </>
                )
            }
        }
    }

    // Render the component:
    return (
        <Container 
            header={<Header variant="h1">Summary</Header>}
            footer={
                <ExpandableSection headerText="Dataset overview" variant="footer">
                    <DatasetOverview modelDetails={modelDetails} />
                </ExpandableSection>
            }
        >
            <ColumnLayout columns={2} variant="text-grid">
                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Sensors</Box>
                        <div>{modelDetails && modelDetails.numSensors - 4} attributes found</div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Timerange</Box>
                        <div>
                            from&nbsp;
                            <b>{modelDetails && modelDetails.startDate}</b> to&nbsp;
                            <b>{modelDetails && modelDetails.endDate}</b>
                        </div>
                    </div>
                </SpaceBetween>

                <SpaceBetween size="l">
                    <div>
                        <Box variant="awsui-key-label">Dataset size</Box>
                        <div>
                            {modelDetails && parseFloat(modelDetails.rowCounts.Table.ItemCount).toLocaleString('en-US')} rows
                        </div>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Average sampling rate</Box>
                        <SamplingRate />
                    </div>
                </SpaceBetween>
            </ColumnLayout>
        </Container>
    )
}

export default DatasetSummary