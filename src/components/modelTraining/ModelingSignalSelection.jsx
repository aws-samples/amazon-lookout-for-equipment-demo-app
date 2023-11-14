// Imports:
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ReactEcharts from "echarts-for-react"
import "../../styles/chartThemeMacarons.js"

// Cloudscape components:
import Alert        from "@cloudscape-design/components/alert"
import Badge        from "@cloudscape-design/components/badge"
import Box          from "@cloudscape-design/components/box"
import Button       from "@cloudscape-design/components/button"
import Cards        from "@cloudscape-design/components/cards"
import Checkbox     from "@cloudscape-design/components/checkbox"
import FormField    from "@cloudscape-design/components/form-field"
import Header       from "@cloudscape-design/components/header"
import Modal        from "@cloudscape-design/components/modal"
import Pagination   from "@cloudscape-design/components/pagination"
import SpaceBetween from "@cloudscape-design/components/space-between"
import Spinner      from "@cloudscape-design/components/spinner"
import Textarea     from "@cloudscape-design/components/textarea"
import TextFilter   from "@cloudscape-design/components/text-filter"

// App components:
import { getSignalDetails } from '../../utils/dataExtraction'
import TimeSeriesHistograms from '../charts/TimeSeriesHistogram.jsx'

// Contexts:
import TimeSeriesContext from '../contexts/TimeSeriesContext'
import ApiGatewayContext from '../contexts/ApiGatewayContext'
import ModelParametersContext from '../contexts/ModelParametersContext'

// Utils
import { getSignalsStatistics, buildChartOptions } from './signalSelectionUtils'
import { useCollection } from '@cloudscape-design/collection-hooks'

// -------------------------------------------------------
// Component to show when the filter ends up with 0 result
// -------------------------------------------------------
function EmptyState({ title, subtitle, action }) {
    return (
        <Box textAlign="center" color="inherit">
            <Box variant="strong" textAlign="center" color="inherit">
                {title}
            </Box>

            <Box variant="p" padding={{ bottom: 's' }} color="inherit">
                {subtitle}
            </Box>

            {action}
        </Box>
    )
}

// -------------------------------------------------------
// Return number of matches found when filtering as a text
// -------------------------------------------------------
function getMatchesCountText(count) {
    return count === 1 ? '1 match' : `${count} matches`
}

function SignalSelectionCards({ 
    cardItems, 
    selectedItems, 
    tagsList, 
    trainingRange, 
    allChecked, 
    data, 
    rangeEnd, 
    x, 
    toggleAllSignals, 
    toggleGrade,
    highGradeChecked,
    mediumGradeChecked,
    lowGradeChecked,
    onSelectionChange,
    setShowSignalsList
}) {
    // Add sorting, filtering and pagination to the table:
    const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
        cardItems,
        {
            filtering: {
                noMatch: (
                    <EmptyState
                        title="No matches"
                        action={<Button onClick={() => actions.setFiltering('')}>Clear filter</Button>}
                    />
                )
            },
            pagination: { pageSize: 10 }
        }
    )

    return (
        <Cards
            {...collectionProps}
            header={
                <SpaceBetween size="xs">
                    <Header
                        counter={
                            selectedItems.length ? "(" + selectedItems.length + `/${tagsList.length})` : `(${tagsList.length})`
                        }
                    >
                        Signals available to train a model
                    </Header>
                    <Box>
                        Selected training data ranges from
                        &nbsp;<b>{new Date(trainingRange.current['startDate']).toISOString().substring(0, 19).replace('T', ' ') }</b>
                        &nbsp;to <b>{new Date(trainingRange.current['endDate']).toISOString().substring(0, 19).replace('T', ' ') }</b>.
                        <Box float="right">
                            <SpaceBetween direction="horizontal" size="xs">
                                <Checkbox 
                                    onChange = {( { detail }) => toggleAllSignals(detail.checked)} 
                                    checked={allChecked}
                                    indeterminate={allChecked && selectedItems.length < tagsList.length}
                                >
                                    All signals
                                </Checkbox>
                                <Checkbox
                                    onChange = {( { detail }) => toggleGrade(detail.checked, 'High')} 
                                    checked={highGradeChecked}
                                >
                                    High
                                </Checkbox>
                                <Checkbox
                                    onChange = {( { detail }) => toggleGrade(detail.checked, 'Medium')} 
                                    checked={mediumGradeChecked}
                                >
                                    Medium
                                </Checkbox>
                                <Checkbox
                                    onChange = {( { detail }) => toggleGrade(detail.checked, 'Low')} 
                                    checked={lowGradeChecked}
                                >
                                    Low
                                </Checkbox>
                            </SpaceBetween>
                        </Box>
                    </Box>
                </SpaceBetween>
            }
            onSelectionChange={ ({ detail }) => onSelectionChange(detail.selectedItems) }
            selectedItems={selectedItems}
            cardDefinition={{
                header: e => e.name,
                sections: [
                    { id: 'issues', header: 'Issues', content: e => e.issues, width: 40 },
                    { id: 'startTime', header: 'Start time', content: e => e.startTime, width: 20 },
                    { id: 'endTime', header: 'End time', content: e => e.endTime, width: 20 },
                    { id: 'grade', header: 'Grade', content: e => e.grade, width: 20 },
                    { 
                        id: 'timeseries',
                        width: 50,
                        content: e => <ReactEcharts 
                                        option={e.chartOptions}
                                        theme="macarons"
                                        style={{height: 200, width: "100%"}}
                                    />
                    },
                    { 
                        id: 'timeseries',
                        width: 50,
                        content: e => <TimeSeriesHistograms
                                        data={data}
                                        ranges={[{start: rangeEnd + 1, end: new Date(x[x.length-1]).getTime()}]} 
                                        sensorName={e.name}
                                        height={200}
                                        width={"100%"}
                                        hideTitle={true}
                                        hideAnimation={true}
                                        gridOptions={{top: 30, left: 50, right: 35, bottom: 25, backgroundColor: '#FFFFFF', show: true}}
                                        colors={['rgb(151, 181, 82, 0.5)', 'rgb(82, 156, 203, 0.5)']}
                                        legend={{top: 0, right: 40, orient: 'horizontal'}}
                                        unselectedTitle={'Evaluation'}
                                        selectedTitle={'Training'}
                                    />
                    },
                ]
            }}
            cardsPerRow={[
                { cards: 1 }, 
                { minWidth: 800, cards: 1 }
            ]}
            items={items}
            selectionType="multi"
            trackBy="name"
            filter={ <SpaceBetween direction="horizontal" size="xl">
                <TextFilter
                    {...filterProps}
                    countText={getMatchesCountText(filteredItemsCount)}
                />
                <Button 
                    iconAlign="left"
                    iconName="file"
                    onClick={(e) => setShowSignalsList(true )}
                >
                    Paste signals list
                </Button>
            </SpaceBetween> }
            pagination={<Pagination {...paginationProps} />}
        />
    )
}

function SignalsListModal( { visible, onDiscard, setSelectedItems, signalsList, tempSelectedItems, setTempSelectedItems, tagsList }) {
    let signals = []
    tempSelectedItems.forEach((item) => {
        signals.push(item.name)
    })
    signals = signals.join('\n')
    signalsList.current = signals

    return (
        <Modal 
            visible={visible} 
            onDismiss={onDiscard} 
            header="Modify signal selection"
            footer={
                <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button variant="link" onClick={onDiscard}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={() => {
                            let signals = []
                            let cleanedUpList = []
                            tempSelectedItems.forEach((item) => {
                                if (tagsList.indexOf(item.name) >= 0) {
                                    signals.push(item.name)
                                    cleanedUpList.push({name: item.name})
                                }
                            })
                            signals = signals.join('\n')
                            signalsList.current = signals

                            setTempSelectedItems(cleanedUpList)
                            setSelectedItems(cleanedUpList)
                            onDiscard()
                        }}>
                            Update signal selection
                        </Button>
                    </SpaceBetween>
                </Box>
            }
        >
            <FormField 
                label="Signal selection"
                description="You can paste a signal selection list your prepared in the control below, one signal per line. You can also directly modify the
                             following list. Bear in mind that any row not found in the signals list will be discarded when you click the update button below."
            >
                <Textarea
                    onChange={({ detail }) => {
                        let list = []
                        detail.value.split('\n').forEach((item) => {
                            if (item !== '') {
                                list.push({name: item})
                            }
                        })
                        setTempSelectedItems(list)
                    }}
                    value={signalsList.current}
                    rows="10"
                />
            </FormField>
        </Modal>
    )
}

// =================================
// Main entry point of the component
// =================================
function ModelingSignalSelection() {
    const { projectName } = useParams()
    const { data, tagsList, x, signals } = useContext(TimeSeriesContext)
    const { gateway, uid } = useContext(ApiGatewayContext)
    const { 
        trainingRange, 
        evaluationRange, 
        selectedItems, 
        allChecked,
        signalsList, 
        tempSelectedItems, 
        setSelectedItems, 
        setAllChecked, 
        setTempSelectedItems, 
    } = useContext(ModelParametersContext)

    const [ signalDetails, setSignalDetails ]           = useState(undefined)
    const [ highGradeChecked, setHighGradeChecked ]     = useState(true)
    const [ mediumGradeChecked, setMediumGradeChecked ] = useState(true)
    const [ lowGradeChecked, setLowGradeChecked ]       = useState(true)
    const [ showSignalsList, setShowSignalsList ]       = useState(false)    

    // Extract the details of the signals to be displayed:
    useEffect(() => {
        getSignalDetails(gateway, uid + '-' + projectName)
        .then((x) => { 
            setSignalDetails(x)
            if (selectedItems.length == 0) {
                toggleAllSignals(allChecked)
            }
        })
    }, [gateway])

    // Called to select all the signals available:
    function toggleAllSignals(checked) {
        if (checked) {
            let selection = []
            tagsList.forEach((tag) => {
                selection.push({ 'name': tag })    
            })
            setSelectedItems(selection)
            setTempSelectedItems(selection)
        }
        else {
            setSelectedItems([])
            setTempSelectedItems([])
        }

        setAllChecked(checked)
        setHighGradeChecked(checked)
        setMediumGradeChecked(checked)
        setLowGradeChecked(checked)
    }

    if (!data.timeseries) {
        return (
            <Alert header="Data preparation in progress">
                Data preparation and ingestion in the app still in progress: after uploading your
                dataset, the app prepares it to optimize visualization speed. This step usually 
                takes 10 to 20 minutes depending on the size of the dataset you uploaded.
            </Alert>
        )
    }
    else if (signalDetails) {
        const { signalInfos, signalAttributes, signalGrade } = getSignalsStatistics(signalDetails)
        const signalOptions = buildChartOptions(tagsList, x, signals, trainingRange, evaluationRange)

        function toggleGrade(checked, targetGrade) {
            let newSelection = []

            if (checked) {
                let currentSelection = []
                newSelection = selectedItems
                selectedItems.forEach((item) => { currentSelection.push(item.name) })

                for (const [tag, grade] of Object.entries(signalGrade)) {
                    if (grade === targetGrade && currentSelection.indexOf(tag) == -1)  {
                        newSelection.push({name: tag})
                    }
                }
            }

            else {
                for (const [key, tag] of Object.entries(selectedItems)) {
                    if (signalGrade[tag.name] !== targetGrade) {
                        newSelection.push({name: tag.name})
                    }
                }
            }

            setSelectedItems(newSelection)
            setTempSelectedItems(newSelection)
            switch (targetGrade) {
                case 'High': 
                    setHighGradeChecked(checked)
                    if (checked && mediumGradeChecked && lowGradeChecked) { setAllChecked(true) }
                    if (!checked && !mediumGradeChecked && !lowGradeChecked) { setAllChecked(false) }
                    break
                case 'Medium': 
                    setMediumGradeChecked(checked)
                    if (highGradeChecked && checked && lowGradeChecked) { setAllChecked(true) }
                    if (!highGradeChecked && !checked && !lowGradeChecked) { setAllChecked(false) }
                    break
                case 'Low':
                    setLowGradeChecked(checked)
                    if (highGradeChecked && mediumGradeChecked && checked) { setAllChecked(true) }
                    if (!highGradeChecked && !mediumGradeChecked && !checked) { setAllChecked(false) }
                    break
            }
        }
        
        let cardItems = []
        tagsList.forEach((tag) => {
            cardItems.push({
                name: tag,
                grade: signalAttributes[tag]['grade'],
                issues: signalInfos[tag].length === 0
                    ? <Badge color="green">None</Badge> 
                    : <SpaceBetween size="xxs" direction="horizontal">{signalInfos[tag].map((issue) => issue)}</SpaceBetween>,
                startTime: signalAttributes[tag]['startTime'],
                endTime: signalAttributes[tag]['endTime'],
                chartOptions: signalOptions[tag]
            })
        })

        const rangeEnd = new Date(trainingRange.current['endDate']).getTime()

        return (<>
                <SignalsListModal 
                    visible={showSignalsList}
                    onDiscard={() => setShowSignalsList(false)}
                    onUpload={() => console.log('Changing selection...')}
                    selectedItems={selectedItems}
                    setSelectedItems={setSelectedItems}
                    signalsList={signalsList}
                    tempSelectedItems={tempSelectedItems}
                    setTempSelectedItems={setTempSelectedItems}
                    tagsList={tagsList}
                />

                <SignalSelectionCards 
                    cardItems={cardItems} 
                    selectedItems={selectedItems} 
                    tagsList={tagsList} 
                    trainingRange={trainingRange} 
                    data={data} 
                    rangeEnd={rangeEnd}
                    x={x}
                    
                    toggleAllSignals={toggleAllSignals}
                    allChecked={allChecked} 

                    toggleGrade={toggleGrade}
                    highGradeChecked={highGradeChecked}
                    mediumGradeChecked={mediumGradeChecked}
                    lowGradeChecked={lowGradeChecked}
                    setShowSignalsList={setShowSignalsList}

                    onSelectionChange={(newSelection) => {
                        setSelectedItems(newSelection) 
                        setTempSelectedItems(newSelection)
                    }}
                />
            </>
        )
    }
    else {
        <Spinner />
    }
}

export default ModelingSignalSelection