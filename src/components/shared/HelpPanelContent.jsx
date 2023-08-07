// CloudScape component:
import Box from "@cloudscape-design/components/box"
import Icon from "@cloudscape-design/components/icon"
import Link from "@cloudscape-design/components/link"
import SpaceBetween from "@cloudscape-design/components/space-between"

// Contains all the help panel contents:
export const helpPanelContent = {
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
                <SpaceBetween size="xs">
                    <Box variant="p">
                        To monitor your equipment or industrial process, you must provide Amazon Lookout for Equipment 
                        with time series data from the sensors on your equipment or process. To provide these time series,
                        you must use properly formatted .csv files to create a dataset. Although Lookout for Equipment
                        accepts a broader set of configuration, this application only allow you to upload a single CSV
                        file for the time being. You must arrange your data using the following format:
                    </Box>

                    <Box variant="code">      
                        Timestamp,Sensor 1,Sensor 2<br />
                        2020/01/01 00:00:00,2,12<br />
                        2020/01/01 00:05:00,3,11<br />
                        2020/01/01 00:10:00,5,10<br />
                        2020/01/01 00:15:00,3,16<br />
                        2020/01/01 00:20:00,4,12<br />
                    </Box>

                    <Box variant="p">
                        You can choose your column names. We recommend using "Timestamp" as the name for the column with the 
                        time-series data. Check the documentation (link below) for the allowed formats for the timestamp column.
                    </Box>

                    <Box variant="p">
                        You must have a double (numerical) as the data type for your sensor data. You can only train your model 
                        on numeric data. The valid characters that you can use in the column names of the dataset are A-Z, a-z, 
                        0-9, . (dot), _ (underscore) and - (hyphen).
                    </Box>
                </SpaceBetween>
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