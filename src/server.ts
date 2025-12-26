import { Hono } from 'hono';
import { renderView } from './controllers/viewController.js';
import { createHash, randomBytes } from 'crypto';

// Detect runtime and use appropriate server
// @ts-ignore - Bun global is available at runtime
const isBun = typeof Bun !== 'undefined';

// PKCE helper functions
function generateCodeVerifier(): string {
  // Generate a random 43-128 character URL-safe string
  const length = 43 + Math.floor(Math.random() * 86); // 43-128 characters
  const bytes = randomBytes(length);
  // Convert to base64url (RFC 7636)
  return bytes.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length);
}

function generateCodeChallenge(verifier: string): string {
  // SHA256 hash of verifier, then base64url encode
  const hash = createHash('sha256').update(verifier).digest();
  return hash.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Configuration
const HYDRA_PUBLIC_URL = process.env.HYDRA_PUBLIC_URL || 'https://hydra-public.priv.dev.workstream.is';
const HYDRA_ADMIN_URL = process.env.HYDRA_ADMIN_URL || 'https://hydra-admin.priv.dev.workstream.is';
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = new Hono();

// In-memory storage for OAuth state and code_verifier (for PKCE)
// In production, use Redis or a proper session store
const oauthStateStore = new Map<string, { state: string; codeVerifier: string; expiresAt: number }>();

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of oauthStateStore.entries()) {
    if (value.expiresAt < now) {
      oauthStateStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Home page
app.get('/', async (c) => {
  const html = await renderView('home', {
    hydraPublicUrl: HYDRA_PUBLIC_URL,
    clientId: CLIENT_ID,
    port: PORT
  });
  return c.html(html);
});

// Initiate Authorization Code flow
app.get('/auth', (c) => {
  try {
    if (!CLIENT_ID) {
      return c.text('CLIENT_ID not configured. Please set it as an environment variable.', 500);
    }

    // Construct redirect URI from request
    const protocol = c.req.header('x-forwarded-proto') || 'http';
    const host = c.req.header('host') || `localhost:${PORT}`;
    const redirectUri = `${protocol}://${host}/callback`;
    
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const scope = 'openid offline';
    
    // Store state and code_verifier in memory (expires in 10 minutes)
    const expiresAt = Date.now() + 10 * 60 * 1000;
    oauthStateStore.set(state, { state, codeVerifier, expiresAt });
    
    const authUrl = `${HYDRA_PUBLIC_URL}/oauth2/auth?` +
      `client_id=${encodeURIComponent(CLIENT_ID)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `prompt=consent&` +
      `code_challenge=${encodeURIComponent(codeChallenge)}&` +
      `code_challenge_method=S256`;

    // Also set cookie as backup (for debugging)
    const cookieOptions = 'HttpOnly; Max-Age=600; Path=/; SameSite=Lax';
    c.header('Set-Cookie', `oauth_state=${state}; ${cookieOptions}`);
    
    return c.redirect(authUrl);
  } catch (error) {
    console.error('Error in /auth endpoint:', error);
    return c.text(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
});

// OAuth callback handler
app.get('/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');
  
  // Get state and code_verifier from memory store
  const storedData = state ? oauthStateStore.get(state) : null;
  const storedState = storedData?.state || null;
  const codeVerifier = storedData?.codeVerifier || null;
  
  // Clean up after use
  if (state) {
    oauthStateStore.delete(state);
  }
  
  // Debug logging
  console.log('[Callback] Received state:', state);
  console.log('[Callback] Stored state:', storedState);
  console.log('[Callback] Code verifier present:', !!codeVerifier);

  if (error) {
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h1>Authorization Error</h1>
          <p><strong>Error:</strong> ${error}</p>
          <p><strong>Description:</strong> ${c.req.query('error_description') || 'No description'}</p>
          <a href="/">← Back to Home</a>
        </body>
      </html>
    `);
  }

  if (!code) {
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h1>No Authorization Code</h1>
          <p>No authorization code was received in the callback.</p>
          <a href="/">← Back to Home</a>
        </body>
      </html>
    `);
  }

  // Verify state (basic CSRF protection)
  if (state !== storedState) {
    console.error('[Callback] State mismatch!');
    console.error('  Received state:', state);
    console.error('  Stored state:', storedState);
    console.error('  State match:', state === storedState);
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h1>State Mismatch</h1>
          <p>State parameter does not match. Possible CSRF attack or expired session.</p>
          <p><strong>Received state:</strong> ${state || 'null'}</p>
          <p><strong>Stored state:</strong> ${storedState || 'null (not found in store)'}</p>
          <p><strong>Store size:</strong> ${oauthStateStore.size} entries</p>
          <a href="/">← Back to Home</a>
        </body>
      </html>
    `);
  }

  // Verify code_verifier is present (required for PKCE)
  if (!codeVerifier) {
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h1>PKCE Error</h1>
          <p>Code verifier is missing. Please restart the authorization flow.</p>
          <a href="/">← Back to Home</a>
        </body>
      </html>
    `);
  }

  // Exchange authorization code for tokens
  // Construct redirect URI from request (must match the one used in /auth)
  const protocol = c.req.header('x-forwarded-proto') || 'http';
  const host = c.req.header('host') || `localhost:${PORT}`;
  const redirectUri = `${protocol}://${host}/callback`;
  
  try {
    // Add audience parameter to ensure token is valid for local API
    const audience = 'http://localhost:3392';
    
    const tokenParams: Record<string, string> = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code_verifier: codeVerifier, // PKCE: include code_verifier
      audience: audience, // Specify audience for local API server
    };
    
    const tokenResponse = await fetch(`${HYDRA_PUBLIC_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenParams),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return c.html(`
        <!DOCTYPE html>
        <html>
          <head><title>Token Exchange Error</title></head>
          <body>
            <h1>Token Exchange Failed</h1>
            <pre>${JSON.stringify(tokenData, null, 2)}</pre>
            <a href="/">← Back to Home</a>
          </body>
        </html>
      `);
    }

    // Test API call with the access token
    const API_URL = 'http://localhost:3392/v2/public/managers/time_entries?startDate=2025-12-22&endDate=2025-12-29&locationIds%5B0%5D=b6f3d953-5ce1-4395-9c25-080b451168fa&statuses%5B0%5D=ended&statuses%5B1%5D=approved&statuses%5B2%5D=started&sortField=clockIn&sortOrder=desc&limit=50';
    interface ApiTestResult {
      status: number;
      statusText: string;
      success: boolean;
      data?: any;
      error?: string;
    }
    
    let apiResult: ApiTestResult | null = null;
    let apiError: string | null = null;
    
    try {
      const apiResponse = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
          'x-core-company-id': 'e71a903f-ff7d-42f2-b0f4-504ddc604ec5',
        },
      });
      
      apiResult = {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        success: apiResponse.ok && apiResponse.status !== 401,
      };
      
      if (apiResponse.ok) {
        apiResult.data = await apiResponse.json();
      } else {
        apiResult.error = await apiResponse.text();
      }
    } catch (error) {
      apiError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Display tokens and API test result
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Success</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 900px; margin: 50px auto; padding: 20px; }
            pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
            .success { color: #28a745; }
            .error { color: #dc3545; }
            .warning { color: #ffc107; }
            .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .api-test { margin: 20px 0; padding: 15px; border-radius: 5px; }
            .api-test.success { background: #d4edda; border: 1px solid #c3e6cb; }
            .api-test.error { background: #f8d7da; border: 1px solid #f5c6cb; }
            .api-test.pending { background: #fff3cd; border: 1px solid #ffeaa7; }
          </style>
        </head>
        <body>
          <h1 class="success">✓ Authorization Code Flow Successful!</h1>
          
          <h2>Received Tokens:</h2>
          <pre>${JSON.stringify(tokenData, null, 2)}</pre>
          
          <h2>API Test Result:</h2>
          <div class="api-test ${apiResult?.success ? 'success' : apiError ? 'error' : 'error'}" id="apiTestResult">
            ${apiError ? `
              <h3 class="error">❌ API Test Failed</h3>
              <p><strong>Error:</strong> ${apiError}</p>
            ` : apiResult ? `
              <h3 class="${apiResult.success ? 'success' : 'error'}">${apiResult.success ? '✅' : '❌'} API Test ${apiResult.success ? 'Successful' : 'Failed'}</h3>
              <p><strong>Status:</strong> ${apiResult.status} ${apiResult.statusText}</p>
              ${apiResult.success ? `
                <p><strong>Result:</strong> Authentication is working! The access token is valid.</p>
                <details>
                  <summary>API Response Data</summary>
                  <pre>${JSON.stringify(apiResult.data, null, 2)}</pre>
                </details>
              ` : `
                <p><strong>Error:</strong> ${apiResult.status === 401 ? '401 Unauthorized - Token may be invalid or expired' : 'API call failed'}</p>
                ${apiResult.error ? `<pre>${apiResult.error}</pre>` : ''}
              `}
            ` : '<p>API test not performed</p>'}
          </div>
          <button onclick="retestAPI()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">🔄 Retest API</button>
          <div id="retestResult" style="margin-top: 15px;"></div>
          
          <script>
            const accessToken = ${JSON.stringify(tokenData.access_token)};
            
            async function retestAPI() {
              const resultDiv = document.getElementById('retestResult');
              const testResultDiv = document.getElementById('apiTestResult');
              resultDiv.innerHTML = '<p>Testing API...</p>';
              testResultDiv.className = 'api-test pending';
              testResultDiv.innerHTML = '<p>Testing API...</p>';
              
              try {
                const response = await fetch('/api/test', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ access_token: accessToken })
                });
                
                const result = await response.json();
                
                testResultDiv.className = 'api-test ' + (result.success ? 'success' : 'error');
                testResultDiv.innerHTML = \`
                  <h3 class="\${result.success ? 'success' : 'error'}">\${result.success ? '✅' : '❌'} API Test \${result.success ? 'Successful' : 'Failed'}</h3>
                  <p><strong>Status:</strong> \${result.status} \${result.statusText}</p>
                  <p><strong>Duration:</strong> \${result.duration}</p>
                  \${result.tokenInfo ? \`
                    <details>
                      <summary>Token Info</summary>
                      <pre>\${JSON.stringify(result.tokenInfo, null, 2)}</pre>
                    </details>
                  \` : ''}
                  \${result.success ? \`
                    <p><strong>Result:</strong> Authentication is working! The access token is valid.</p>
                    <details>
                      <summary>API Response Data</summary>
                      <pre>\${JSON.stringify(result.data, null, 2)}</pre>
                    </details>
                  \` : \`
                    <p><strong>Error:</strong> \${result.error || 'API call failed'}</p>
                    \${result.errorDetails ? \`<pre>\${result.errorDetails}</pre>\` : ''}
                    \${result.curlCommand ? \`
                      <details>
                        <summary>cURL Command</summary>
                        <pre>\${result.curlCommand}</pre>
                      </details>
                    \` : ''}
                  \`}
                \`;
                
                resultDiv.innerHTML = result.success 
                  ? '<p style="color: #28a745;">✅ API test completed!</p>'
                  : '<p style="color: #dc3545;">❌ API test failed. See details above.</p>';
              } catch (error) {
                testResultDiv.className = 'api-test error';
                testResultDiv.innerHTML = \`<h3 class="error">❌ API Test Error</h3><p>\${error.message}</p>\`;
                resultDiv.innerHTML = '<p style="color: #dc3545;">Error: ' + error.message + '</p>';
              }
            }
          </script>
          
          <h2>Authorization Code:</h2>
          <pre>${code}</pre>
          
          <h2>cURL Command for Manual Testing:</h2>
          <pre>curl -X POST '${HYDRA_PUBLIC_URL}/oauth2/token' \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d 'grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}'</pre>
          
          ${apiResult && apiResult.success ? `
          <h2>cURL Command to Test API:</h2>
          <pre>curl -X GET '${API_URL}' \\
  -H 'Authorization: Bearer ${tokenData.access_token}' \\
  -H 'Content-Type: application/json' \\
  -H 'x-core-company-id: e71a903f-ff7d-42f2-b0f4-504ddc604ec5'</pre>
          ` : ''}
          
          <a href="/" class="btn">← Back to Home</a>
        </body>
      </html>
    `);
  } catch (error) {
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error</h1>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
          <a href="/">← Back to Home</a>
        </body>
      </html>
    `);
  }
});

// Device Authorization Flow demo page
app.get('/device-demo', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Device Authorization Flow Demo</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
          button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background: #0056b3; }
          button:disabled { background: #ccc; cursor: not-allowed; }
          pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
          .user-code { font-size: 24px; font-weight: bold; color: #007bff; text-align: center; padding: 20px; }
          .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
          .status.pending { background: #fff3cd; }
          .status.success { background: #d4edda; }
          .status.error { background: #f8d7da; }
        </style>
      </head>
      <body>
        <h1>Device Authorization Flow Demo</h1>
        
        <div class="card">
          <h2>Step 1: Request Device Code</h2>
          <button id="requestCodeBtn" onclick="requestDeviceCode()">Request Device & User Codes</button>
          <div id="codeResult"></div>
        </div>
        
        <div class="card" id="userAuthCard" style="display: none;">
          <h2>Step 2: User Authorization</h2>
          <p>Please visit the verification URI and enter the user code:</p>
          <div class="user-code" id="userCode"></div>
          <p><strong>Verification URI:</strong></p>
          <p><a href="#" id="verificationUri" target="_blank"></a></p>
          <button id="pollBtn" onclick="startPolling()">Start Polling for Token</button>
          <div id="pollStatus"></div>
        </div>
        
        <div class="card" id="tokenResult" style="display: none;">
          <h2>Step 3: Tokens Received</h2>
          <pre id="tokenData"></pre>
        </div>
        
        <script>
          let deviceCode = '';
          let interval = 5;
          let pollInterval = null;
          
          async function requestDeviceCode() {
            const btn = document.getElementById('requestCodeBtn');
            btn.disabled = true;
            btn.textContent = 'Requesting...';
            
            try {
              const response = await fetch('/device/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  client_id: '${CLIENT_ID}',
                  client_secret: '${CLIENT_SECRET}',
                  scope: 'openid offline'
                })
              });
              
              const data = await response.json();
              
              if (!response.ok) {
                throw new Error(data.error || 'Failed to request device code');
              }
              
              deviceCode = data.device_code;
              interval = data.interval || 5;
              
              document.getElementById('userCode').textContent = data.user_code;
              document.getElementById('verificationUri').href = data.verification_uri;
              document.getElementById('verificationUri').textContent = data.verification_uri;
              document.getElementById('userAuthCard').style.display = 'block';
              
              document.getElementById('codeResult').innerHTML = 
                '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
              
            } catch (error) {
              document.getElementById('codeResult').innerHTML = 
                '<div class="status error">Error: ' + error.message + '</div>';
            } finally {
              btn.disabled = false;
              btn.textContent = 'Request Device & User Codes';
            }
          }
          
          async function startPolling() {
            const pollBtn = document.getElementById('pollBtn');
            pollBtn.disabled = true;
            pollBtn.textContent = 'Polling...';
            
            const statusDiv = document.getElementById('pollStatus');
            statusDiv.innerHTML = '<div class="status pending">Waiting for user authorization...</div>';
            
            pollInterval = setInterval(async () => {
              try {
                const response = await fetch('/device/poll', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    device_code: deviceCode,
                    client_id: '${CLIENT_ID}',
                    client_secret: '${CLIENT_SECRET}'
                  })
                });
                
                const data = await response.json();
                
                if (data.access_token) {
                  // Success!
                  clearInterval(pollInterval);
                  document.getElementById('tokenData').textContent = JSON.stringify(data, null, 2);
                  document.getElementById('tokenResult').style.display = 'block';
                  statusDiv.innerHTML = '<div class="status success">✓ Authorization complete! Tokens received.</div>';
                  pollBtn.textContent = 'Polling Complete';
                } else if (data.error === 'authorization_pending') {
                  statusDiv.innerHTML = '<div class="status pending">Still waiting for authorization...</div>';
                } else if (data.error === 'slow_down') {
                  interval += 5;
                  statusDiv.innerHTML = '<div class="status pending">Slow down requested. Increasing polling interval...</div>';
                } else if (data.error === 'expired_token') {
                  clearInterval(pollInterval);
                  statusDiv.innerHTML = '<div class="status error">Device code expired. Please start over.</div>';
                  pollBtn.disabled = false;
                  pollBtn.textContent = 'Start Polling for Token';
                } else {
                  clearInterval(pollInterval);
                  statusDiv.innerHTML = '<div class="status error">Error: ' + (data.error_description || data.error) + '</div>';
                  pollBtn.disabled = false;
                  pollBtn.textContent = 'Start Polling for Token';
                }
              } catch (error) {
                clearInterval(pollInterval);
                statusDiv.innerHTML = '<div class="status error">Error: ' + error.message + '</div>';
                pollBtn.disabled = false;
                pollBtn.textContent = 'Start Polling for Token';
              }
            }, interval * 1000);
          }
        </script>
      </body>
    </html>
  `);
});

// Device code request endpoint
app.post('/device/request', async (c) => {
  try {
    const { client_id, client_secret, scope } = await c.req.json();
    
    const response = await fetch(`${HYDRA_PUBLIC_URL}/oauth2/device/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: client_id || CLIENT_ID,
        client_secret: client_secret || CLIENT_SECRET,
        scope: scope || 'openid offline',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return c.json({ error: data.error || 'Failed to request device code', ...data }, response.status as any);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// Device token polling endpoint
app.post('/device/poll', async (c) => {
  try {
    const { device_code, client_id, client_secret } = await c.req.json();
    
    const response = await fetch(`${HYDRA_PUBLIC_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: device_code,
        client_id: client_id || CLIENT_ID,
        client_secret: client_secret || CLIENT_SECRET,
      }),
    });

    const data = await response.json();
      return c.json(data, response.status as any);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// Client Credentials Flow demo page
app.get('/client-credentials-demo', async (c) => {
  // Fetch client info to get configured scopes
  let clientScopes = 'openid offline'; // Default fallback
  try {
    if (CLIENT_ID) {
      const clientResponse = await fetch(`${HYDRA_ADMIN_URL}/admin/clients/${CLIENT_ID}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (clientResponse.ok) {
        const clientData = await clientResponse.json();
        clientScopes = clientData.scope || 'openid offline';
      }
    }
  } catch (error) {
    console.warn('[Client Credentials Demo] Could not fetch client scopes, using default:', error);
  }
  
  const html = await renderView('client-credentials-demo', {
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    clientScopes: clientScopes
  });
  return c.html(html);
});

// Client Credentials token endpoint
app.post('/client-credentials/token', async (c) => {
  try {
    const { client_id, client_secret, scope } = await c.req.json();
    
    const response = await fetch(`${HYDRA_PUBLIC_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: client_id || CLIENT_ID,
        client_secret: client_secret || CLIENT_SECRET,
        scope: scope || 'openid offline',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return c.json({ error: data.error || 'Failed to get access token', ...data }, response.status as any);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// Helper function to decode JWT (without verification, just for inspection)
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = Buffer.from(paddedPayload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('[JWT Decode] Error:', error);
    return null;
  }
}

// Generic API test endpoint (for Authorization Code flow and others)
app.post('/api/test', async (c) => {
  try {
    const { access_token } = await c.req.json();
    
    if (!access_token) {
      return c.json({ success: false, error: 'No access token provided' }, 400);
    }

    // Decode token to inspect its contents
    const tokenPayload = decodeJWT(access_token);
    console.log(`[Test API] Token payload:`, JSON.stringify(tokenPayload, null, 2));
    
    const API_URL = 'https://api.dev.workstream.us/hris/v1/jobs';
    
    console.log(`[Test API] Server-side: Making external API call to ${API_URL}`);
    console.log(`[Test API] Token scopes: ${tokenPayload?.scp || tokenPayload?.scope || 'N/A'}`);
    console.log(`[Test API] Token audience: ${JSON.stringify(tokenPayload?.aud || 'N/A')}`);
    console.log(`[Test API] Token subject: ${tokenPayload?.sub || 'N/A'}`);
    
    const startTime = Date.now();
    const apiResponse = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'x-core-company-id': 'e71a903f-ff7d-42f2-b0f4-504ddc604ec5',
      },
    });
    const duration = Date.now() - startTime;

    console.log(`[Test API] External API responded: ${apiResponse.status} ${apiResponse.statusText} (took ${duration}ms)`);

    const result: any = {
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      success: apiResponse.ok && apiResponse.status !== 401,
      apiUrl: API_URL,
      requestMethod: 'GET',
      duration: `${duration}ms`,
      curlCommand: `curl -X GET "${API_URL}" \\\n  -H "Authorization: Bearer ${access_token}" \\\n  -H "Content-Type: application/json" \\\n  -H "x-core-company-id: e71a903f-ff7d-42f2-b0f4-504ddc604ec5"`,
      tokenInfo: tokenPayload ? {
        scopes: tokenPayload.scp || tokenPayload.scope || 'N/A',
        audience: tokenPayload.aud || 'N/A',
        subject: tokenPayload.sub || 'N/A',
        clientId: tokenPayload.client_id || 'N/A',
        expiresAt: tokenPayload.exp ? new Date(tokenPayload.exp * 1000).toISOString() : 'N/A',
        issuedAt: tokenPayload.iat ? new Date(tokenPayload.iat * 1000).toISOString() : 'N/A',
      } : null,
    };

    if (apiResponse.ok) {
      try {
        result.data = await apiResponse.json();
      } catch (e) {
        result.data = await apiResponse.text();
      }
    } else {
      try {
        result.error = await apiResponse.text();
      } catch (e) {
        result.error = `Failed to read error response: ${e instanceof Error ? e.message : 'Unknown error'}`;
      }
    }

    return c.json(result);
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// Client Credentials API test endpoint
app.post('/client-credentials/test-api', async (c) => {
  try {
    const { access_token } = await c.req.json();
    
    if (!access_token) {
      return c.json({ success: false, error: 'No access token provided' }, 400);
    }

    // Decode token to inspect its contents
    const tokenPayload = decodeJWT(access_token);
    console.log(`[Test API] Token payload:`, JSON.stringify(tokenPayload, null, 2));
    
    const API_URL = 'https://api.dev.workstream.us/hris/v1/jobs';
    
    console.log(`[Test API] Server-side: Making external API call to ${API_URL}`);
    console.log(`[Test API] Token scopes: ${tokenPayload?.scp || tokenPayload?.scope || 'N/A'}`);
    console.log(`[Test API] Token audience: ${JSON.stringify(tokenPayload?.aud || 'N/A')}`);
    console.log(`[Test API] Token subject: ${tokenPayload?.sub || 'N/A'}`);
    
    const startTime = Date.now();
    const apiResponse = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'x-core-company-id': 'e71a903f-ff7d-42f2-b0f4-504ddc604ec5',
      },
    });
    const duration = Date.now() - startTime;

    console.log(`[Test API] External API responded: ${apiResponse.status} ${apiResponse.statusText} (took ${duration}ms)`);

    const result: any = {
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      success: apiResponse.ok && apiResponse.status !== 401,
      apiUrl: API_URL, // Include the external API URL in response
      requestMethod: 'GET',
      duration: `${duration}ms`,
      curlCommand: `curl -X GET "${API_URL}" \\\n  -H "Authorization: Bearer ${access_token}" \\\n  -H "Content-Type: application/json" \\\n  -H "x-core-company-id: e71a903f-ff7d-42f2-b0f4-504ddc604ec5"`,
      testApiCurlCommand: `curl -X POST "http://localhost:${PORT}/client-credentials/test-api" \\\n  -H "Content-Type: application/json" \\\n  -d '{"access_token":"${access_token}"}'`,
      tokenInfo: tokenPayload ? {
        scopes: tokenPayload.scp || tokenPayload.scope || 'N/A',
        audience: tokenPayload.aud || 'N/A',
        subject: tokenPayload.sub || 'N/A',
        clientId: tokenPayload.client_id || 'N/A',
        expiresAt: tokenPayload.exp ? new Date(tokenPayload.exp * 1000).toISOString() : 'N/A',
        issuedAt: tokenPayload.iat ? new Date(tokenPayload.iat * 1000).toISOString() : 'N/A',
      } : null,
    };

    if (apiResponse.ok) {
      result.data = await apiResponse.json();
      console.log(`[Test API] Success! Got data from external API`);
    } else {
      const errorText = await apiResponse.text();
      let errorMsg = apiResponse.status === 401 
        ? 'Unauthorized (401) - The external API call WAS made successfully, but the API returned 401.' 
        : `External API call failed with status ${apiResponse.status}`;
      
      if (apiResponse.status === 401) {
        errorMsg += '\n\nPossible reasons:';
        errorMsg += '\n1. Token scopes may not match what the API requires';
        errorMsg += '\n2. Token audience may not include the API endpoint';
        errorMsg += '\n3. API may require additional permissions/claims';
        errorMsg += `\n\nToken has scopes: ${tokenPayload?.scp || tokenPayload?.scope || 'N/A'}`;
        errorMsg += `\nToken audience: ${JSON.stringify(tokenPayload?.aud || 'N/A')}`;
      }
      
      result.error = errorMsg;
      result.errorDetails = errorText;
      result.errorMessage = `External API (${API_URL}) returned: ${errorText.substring(0, 200)}`;
      console.log(`[Test API] External API error: ${result.error}`);
      console.log(`[Test API] Error details: ${errorText.substring(0, 200)}`);
    }

    return c.json(result);
  } catch (error) {
    console.error('[Test API] Exception making external API call:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error instanceof Error ? error.stack : undefined,
      note: 'This error occurred when the server tried to call the external API. Check server logs for details.'
    }, 500);
  }
});

// Client Management UI
app.get('/clients', async (c) => {
  const html = await renderView('clients', {});
  return c.html(html);
});

// Removed /clients-old route - using EJS template now

// API: List all clients
app.get('/api/clients', async (c) => {
  try {
    const response = await fetch(`${HYDRA_ADMIN_URL}/admin/clients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: error || 'Failed to fetch clients' }, response.status as any);
    }

    const clients = await response.json();
    return c.json(Array.isArray(clients) ? clients : []);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Check for certificate/SSL errors
    if (errorMessage.includes('certificate') || errorMessage.includes('SSL') || errorMessage.includes('TLS')) {
      return c.json({ 
        error: 'VPN Connection Required',
        error_description: 'Unable to connect to Hydra admin endpoint. Please ensure you are connected to the company VPN.',
        details: errorMessage
      }, 503);
    }
    return c.json({ error: errorMessage }, 500);
  }
});

// API: Get single client
app.get('/api/clients/:id', async (c) => {
  try {
    const clientId = c.req.param('id');
    const response = await fetch(`${HYDRA_ADMIN_URL}/admin/clients/${clientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: error || 'Failed to fetch client' }, response.status as any);
    }

    const client = await response.json();
    return c.json(client);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// API: Create client
app.post('/api/clients', async (c) => {
  try {
    const clientData = await c.req.json();
    
    const response = await fetch(`${HYDRA_ADMIN_URL}/admin/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return c.json({ error: data.error || 'Failed to create client', ...data }, response.status as any);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// API: Update client
app.put('/api/clients/:id', async (c) => {
  try {
    const clientId = c.req.param('id');
    const clientData = await c.req.json();
    
    const response = await fetch(`${HYDRA_ADMIN_URL}/admin/clients/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return c.json({ error: data.error || 'Failed to update client', ...data }, response.status as any);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// API: Delete client
app.delete('/api/clients/:id', async (c) => {
  try {
    const clientId = c.req.param('id');
    
    const response = await fetch(`${HYDRA_ADMIN_URL}/admin/clients/${clientId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ error: error || 'Failed to delete client' }, response.status as any);
    }

    return c.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

console.log(`🚀 OAuth Verification Server running on http://localhost:${PORT}`);
console.log(`📖 Open http://localhost:${PORT} in your browser`);
console.log(`\nConfiguration:`);
console.log(`  Hydra Public URL: ${HYDRA_PUBLIC_URL}`);
console.log(`  Client ID: ${CLIENT_ID || 'Not set (use CLIENT_ID env var)'}`);
console.log(`  Port: ${PORT}`);
console.log(`  Runtime: ${isBun ? 'Bun' : 'Node.js'}\n`);

// Start server based on runtime
if (isBun) {
  // Bun native server
  // @ts-ignore - Bun global is available at runtime
  Bun.serve({
    port: PORT,
    fetch: app.fetch,
  });
} else {
  // Node.js - use @hono/node-server
  const { serve } = await import('@hono/node-server');
  serve({
    fetch: app.fetch,
    port: PORT,
  });
}

