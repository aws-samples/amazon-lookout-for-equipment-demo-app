import Icon from "@cloudscape-design/components/icon"
import Link from "@cloudscape-design/components/link"

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

export const helpPanelContent = {
    createProject: {
        dataset: {
            header: (<div>Dataset format</div>),
            footer: 
                (
                    <ExternalLinkGroup
                        items={[{ 
                            href: 'https://docs.aws.amazon.com/lookout-for-equipment/latest/ug/formatting-data.html', 
                            text: 'Formatting your data for Lookout for Equipment' 
                        }]}
                    />
                ),
            body: (<div>Body</div>)
        }
    }
}