describe('Login process', () => {
    context('Login should be successful when', () => {
        it('Logging with existing credentials and click Sign', () => {
            cy.visit('http://127.0.0.1:5173/')
            cy.contains('Sign in')
            cy.get('input[id="amplify-id-:r5e:"]').type(Cypress.env('username'))
            cy.get('input[id="amplify-id-:r5k:"]').type(`${Cypress.env('password')}{enter}`)
            cy.contains('Welcome!')
            cy.get('h2').should('contain', Cypress.env('username'))
        })    
    })

    context('Login should fail when', () => {
        it('Trying to log with bad credentials', () => {
            cy.visit('http://127.0.0.1:5173/')
            cy.contains('Sign in')
            cy.get('input[id="amplify-id-:r5e:"]').type(Cypress.env('username'))
            cy.get('input[id="amplify-id-:r5k:"]').type(`${'bad-password'}{enter}`)
            cy.contains('Incorrect username or password.')
        })    
    })
})