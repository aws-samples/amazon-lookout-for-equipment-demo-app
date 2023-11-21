// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

Cypress.Commands.add('login', (username, password) => {
    cy.session(
        username,
        () => {
            cy.visit('http://127.0.0.1:5173/')
            cy.contains('Sign in')
            cy.get('input[id="amplify-id-:r5e:"]').type(username)
            cy.get('input[id="amplify-id-:r5k:"]').type(`${password}{enter}`)
            cy.contains('Welcome!')
            cy.get('h2').should('contain', username)
        },
        {
            validate: () => {
                cy.visit('http://127.0.0.1:5173/')
                cy.contains('Welcome!')
                cy.get('h2').should('contain', username)
            }
        }
    )
})