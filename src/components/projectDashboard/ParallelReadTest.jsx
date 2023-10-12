import { useContext, useEffect } from 'react'
import ApiGatewayContext from '../contexts/ApiGatewayContext'
import { getAllTimeseries, getAllTimeseriesWindow } from '../../utils/dataExtraction.js'
import { getProjectDetails } from './projectDashboardUtils'

function ParallelReadTest() {
    const { gateway, uid } = useContext(ApiGatewayContext)
    const projectName = 'FeedWaterPump11'

    async function getTimeseries_v1() {
        const startTime = Date.now()
        const data = await getAllTimeseries(gateway, `${uid}-${projectName}`)
        const endTime = Date.now()
        console.log(`============== V1: ${endTime - startTime} ms =================`)

        return data
    }

    async function getTimeseries_v4() {
        const startTime = Date.now()
        const data = await getAllTimeseries(gateway, `${uid}-${projectName}`)
        const endTime = Date.now()
        console.log(`============== V4: ${endTime - startTime} ms =================`)

        return data
    }

    async function getTimeseries_v3() {
        const startTime = Date.now()
        const data = await getAllTimeseriesWindow(
            gateway, 
            `${uid}-${projectName}`,
            "2021-03-07 09:47:00",
            "2023-03-07 09:27:00"
        )
        const endTime = Date.now()
        console.log(`============== V3: ${endTime - startTime} ms =================`)

        return data
    }

    async function getTimeseries_v2() {
        const start = Date.now()
        
        // const projectDetails = await getProjectDetails(gateway, uid, projectName)
        const startDate = new Date("2021-03-07 09:47:00").getTime()
        const endDate = new Date("2023-03-07 09:27:00").getTime()
        const numSegments = 10
        const segmentWidth = (endDate - startDate) / numSegments
        let startTime = startDate
        let endTime = startTime + segmentWidth
        let queries = []

        for (var i = 0; i < numSegments; i++) {
            queries.push(getAllTimeseriesWindow(
                gateway, 
                `${uid}-${projectName}`, 
                (startTime + i*segmentWidth) / 1000, (endTime + i*segmentWidth) / 1000
            ))
        }

        const results = await Promise.all(queries)
        let current1 = Date.now()
        console.log(`============== V2 (query): ${current1 - start} ms =================`)

        let data = {
            timeseries: {Items: []},
            startDate: results[0].startDate,
            endDate: results[0].endDate,
            tagsList: results[0].tagsList
        }
        results.forEach((chunk) => {
            data.timeseries.Items = [...data.timeseries.Items, ...chunk.timeseries.Items]
            if (chunk.startDate <= data.startDate) { data.startDate = chunk.startDate }
            if (chunk.endDate >= data.endDate) { data.endDate = chunk.endDate }
        })

        function compareTimestamp(a, b) {
            return a.unix_timestamp.N - b.unix_timestamp.N
        }

        let current2 = Date.now()
        console.log(`============== V2 (assemble): ${current2 - current1} ms =================`)


        data.timeseries.Items.sort(compareTimestamp)


        const end = Date.now()
        console.log(`============== V2 (sort): ${end - current2} ms =================`)

        return data
    }

    // useEffect(() => {
    //     getTimeseries_v1()
    //     .then((x) => console.log(x))
    // }, [gateway, uid])

    // // useEffect(() => {
    // //     getTimeseries_v2()
    // //     .then((x) => console.log(x))
    // // }, [gateway, uid])

    // // useEffect(() => {
    // //     getTimeseries_v3()
    // //     .then((x) => console.log(x))
    // // }, [gateway, uid])

    // useEffect(() => {
    //     getTimeseries_v4()
    //     .then((x) => console.log(x))
    // }, [gateway, uid])

    return (<div></div>)
}

export default ParallelReadTest