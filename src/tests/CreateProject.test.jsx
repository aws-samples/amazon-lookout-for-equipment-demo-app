// These imports are necessary to build the
// context around the component to be tested:
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom'
import { ApiGatewayProvider } from '../components/contexts/ApiGatewayContext'

// Component to be tested:
import CreateProject from '../components/CreateProject'

// Testing environment:
import { render, fireEvent, screen, waitFor } from '@testing-library/react'

function TestedComponent() {
    return (
        <Router initialEntries={['/create-project']}>
            <ApiGatewayProvider user="test_user">
                <Routes>
                    <Route path="/create-project" element={<CreateProject />} />
                </Routes>
            </ApiGatewayProvider>
        </Router>
    )
}

describe('CreateProject Front-end', () => {
    test('Project name too short', async () => {
        // Render the component to be tested:
        render(<TestedComponent />)

        // Tests suite:
        const input = document.querySelector('input')
        expect(input).toBeTruthy()
        expect(input?.textContent).toBe('')

        const button = document.querySelector('button[class*="variant-primary"]')
        expect(button).toBeTruthy()

        if (input) {
            input.textContent = 'ab'
            expect(input.textContent).toBe('ab')
            fireEvent.change(input, {target: {value: 'ab'}})
            expect(input.value).toBe('ab')

            fireEvent.click(screen.getByText(/Create project/i))
            const errorMessage = await screen.findByText('Project name must be at least 3 characters long')
            expect(errorMessage).toBeTruthy()
        }
    })

    test('Invalid characters in project name', async () => {
        // Render the component to be tested:
        render(<TestedComponent />)

        // Tests suite:
        const input = document.querySelector('input')

        if (input) {
            input.textContent = 'test#project'
            fireEvent.change(input, {target: {value: 'test#project'}})

            fireEvent.click(screen.getByText(/Create project/i))
            const errorMessage = await screen.findByText('Project name can have up to 170 characters. Valid characters are a-z, A-Z, 0-9, _ (underscore), and - (hyphen)')
            expect(errorMessage).toBeTruthy()
        }
    })

    test('No file selected', async () => {
        // Render the component to be tested:
        render(<TestedComponent />)

        // Tests suite:
        const input = document.querySelector('input')

        if (input) {
            input.textContent = 'TestProject'
            fireEvent.change(input, {target: {value: 'TestProject'}})
            fireEvent.click(screen.getByText(/Create project/i))

            const errorMessage = await screen.findByText('You must select a file to upload')
            expect(errorMessage).toBeTruthy()
        }
    })

    test('Project name unavailable', async () => {
        // Render the component to be tested:
        render(<TestedComponent />)

        // Tests suite:
        const input = document.querySelector('input')

        if (input) {
            input.textContent = 'Paris'
            fireEvent.change(input, {target: {value: 'Paris'}})
            fireEvent.click(screen.getByText(/Create project/i))

            const errorMessage = screen.findByText('Project name not available')
            await waitFor(() => expect(errorMessage).toBeTruthy())
        }
    })
})


// const fs = require('fs')
// import { prettyDOM } from '@testing-library/react'

// const dom = prettyDOM(document.getElementById('root'), 100000)      
// fs.writeFile('output.ansi', dom, (err) => {
//     if (err) {
//         console.log(err)
//         throw err
//     }
// })
