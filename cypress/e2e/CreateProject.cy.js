describe('Create a new project', () => {
    beforeEach(() =>{
        cy.login(Cypress.env('username'), Cypress.env('password'))
    })


    // context('Creating a project should fail when', () => {

    // })

    context('Creating a project should be successful when', () => {
        it('Submitting by uploading a valid CSV file', () => {
            const projectName = 'Cypress-v1'

            cy.visit('http://127.0.0.1:5173/')
    
            // Navigate to Create Project page:
            cy.get('a').contains('Create project').click()
    
            // Replace the default "Demo-Project" name by one used for this test:
            cy.get('input[name="create-project-name"]').should((projectName) => {
                expect(projectName).to.have.value('Demo-Project')
            })
            cy.get('input[name="create-project-name"]').clear()
            cy.get('input[name="create-project-name"]').type(projectName)

            // Fills in a project description:
            cy.get('input[name="create-project-asset-description"]').type('Cypress')

            // Selects a file to upload as a dataset:
            cy.get('input[id="create-project-file-upload"]').as('fileInput')
            cy.fixture('dataset-normal.csv').then(fileContent => {
                cy.get('@fileInput').attachFile({
                    fileContent: fileContent,
                    fileName: 'dataset.csv',
                    mimeType: 'application/csv'
                })
            })

            // Clicks create project:
            cy.get('button[type="submit"]').contains('Create project').click()

            // Wait for the data preparation in progress to be done
            cy.get('div', { timeout: 20000 }).should('contain', 'Data preparation in progress')
            cy.get('li[class^="awsui_list-item"]').should('contain', projectName)
            cy.get('h1[class^="awsui_heading"]').should('contain', `${projectName} overview`)
            cy.location('pathname').should('eq', `/project-dashboard/projectName/${projectName}`)
        })
    })
})