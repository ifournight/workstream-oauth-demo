import { http, HttpResponse } from 'msw'

/**
 * MSW handlers for mocking API requests
 */
export const handlers = [
  // Mock Hydra token endpoint
  http.post('https://hydra-public.priv.dev.workstream.is/oauth2/token', async ({ request }) => {
    const body = await request.formData()
    const code = body.get('code')
    
    if (code === 'valid_code') {
      return HttpResponse.json({
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid offline',
      })
    }
    
    return HttpResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid authorization code' },
      { status: 400 }
    )
  }),

  // Mock Hydra auth endpoint
  http.get('https://hydra-public.priv.dev.workstream.is/oauth2/auth', () => {
    return HttpResponse.redirect('http://localhost:3000/api/auth/callback?code=valid_code&state=mock_state')
  }),

  // Mock session API
  http.get('http://localhost:3000/api/auth/session', () => {
    return HttpResponse.json({
      authenticated: true,
      user: {
        identityId: 'mock-identity-id',
      },
    })
  }),

  http.post('http://localhost:3000/api/auth/session', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      success: true,
      user: {
        identityId: 'mock-identity-id',
      },
    })
  }),

  http.delete('http://localhost:3000/api/auth/session', () => {
    return HttpResponse.json({ success: true })
  }),
]
