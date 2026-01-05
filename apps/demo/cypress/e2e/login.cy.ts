describe('Login Flow E2E', () => {
  beforeEach(() => {
    // Clear cookies and session before each test
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should redirect to login page when not authenticated', () => {
    cy.visit('/')
    cy.url().should('include', '/login')
  })

  it('should display login page with password and passkey options', () => {
    cy.visit('/login')
    cy.contains('Sign in to your account').should('be.visible')
    cy.get('[data-cy="login-button"]').should('be.visible')
    cy.get('[data-cy="passkey-login-button"]').should('be.visible')
  })

  it('should start login flow when password login button is clicked', () => {
    cy.visit('/login')
    cy.get('[data-cy="login-button"]').click()
    // Should redirect to login API which redirects to Hydra
    cy.url().should('include', '/api/auth/login')
  })

  it('should start login flow when passkey login button is clicked', () => {
    cy.visit('/login')
    cy.get('[data-cy="passkey-login-button"]').click()
    // Should redirect to login API which redirects to Hydra
    cy.url().should('include', '/api/auth/login')
  })

  it('should display error message when error parameter is present', () => {
    cy.visit('/login?error=access_denied&error_description=User%20denied%20access')
    cy.contains('access_denied').should('be.visible')
  })

  it('should preserve return_url parameter', () => {
    cy.visit('/login?return_url=/dashboard')
    cy.get('[data-cy="login-button"]').click()
    cy.url().should('include', 'return_url')
  })
})
