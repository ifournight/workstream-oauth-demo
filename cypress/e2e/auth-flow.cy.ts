describe('Complete Authentication Flow E2E', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('should complete full authentication flow', () => {
    // Start at home page - should redirect to login
    cy.visit('/')
    cy.url().should('include', '/login')

    // Click login button
    cy.get('[data-cy="login-button"]').click()
    
    // Should redirect to login API
    cy.url().should('include', '/api/auth/login')
    
    // Note: In a real test, we would need to mock Hydra or use a test environment
    // For now, we just verify the flow starts correctly
  })

  it('should handle callback with authorization code', () => {
    // Mock successful token exchange
    cy.intercept('POST', '**/oauth2/token', {
      statusCode: 200,
      body: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid offline',
      },
    }).as('tokenExchange')

    // Mock session API
    cy.intercept('GET', '**/api/auth/session', {
      statusCode: 200,
      body: {
        authenticated: true,
        user: {
          identityId: 'test-identity-id',
        },
      },
    }).as('getSession')

    // Visit callback with code
    cy.visit('/api/auth/callback?code=test-code&state=test-state')
    
    // Should exchange token
    cy.wait('@tokenExchange')
    
    // Should redirect to home
    cy.url().should('not.include', '/callback')
  })

  it('should handle logout', () => {
    // Set up authenticated session
    cy.setCookie('auth_session', 'mock-session-cookie')
    
    cy.intercept('DELETE', '**/api/auth/session', {
      statusCode: 200,
      body: { success: true },
    }).as('logout')

    cy.intercept('GET', '**/api/auth/session', {
      statusCode: 200,
      body: {
        authenticated: false,
        user: null,
      },
    }).as('getSession')

    // Visit a protected page
    cy.visit('/clients')
    
    // Logout (this would be triggered by clicking logout button in nav)
    // For now, we just test the API call
    cy.request('DELETE', '/api/auth/session').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
    })
  })

  it('should protect routes and redirect to login', () => {
    // Try to access protected route without authentication
    cy.visit('/clients')
    
    // Should redirect to login
    cy.url().should('include', '/login')
    cy.url().should('include', 'return_url')
  })
})
