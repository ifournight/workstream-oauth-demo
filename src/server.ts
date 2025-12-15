import { Hono } from 'hono';

// Detect runtime and use appropriate server
// @ts-ignore - Bun global is available at runtime
const isBun = typeof Bun !== 'undefined';

// Configuration
const HYDRA_PUBLIC_URL = process.env.HYDRA_PUBLIC_URL || 'https://hydra-public.priv.dev.workstream.is';
const HYDRA_ADMIN_URL = process.env.HYDRA_ADMIN_URL || 'https://hydra-admin.priv.dev.workstream.is';
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = new Hono();

// Home page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>OAuth 2.0 Verification Server</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
          .btn:hover { background: #0056b3; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
          pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>OAuth 2.0 Verification Server</h1>
        <p>This server helps verify OAuth 2.0 flows with Ory Hydra.</p>
        
        <div class="card">
          <h2>Authorization Code Flow</h2>
          <p>Click the button below to start the Authorization Code flow:</p>
          <a href="/auth" class="btn">Start Authorization Code Flow</a>
        </div>
        
        <div class="card">
          <h2>Device Authorization Flow</h2>
          <p>Test the Device Authorization flow:</p>
          <a href="/device-demo" class="btn">Start Device Flow</a>
        </div>
        
        <div class="card">
          <h2>Configuration</h2>
          <p><strong>Hydra Public URL:</strong> <code>${HYDRA_PUBLIC_URL}</code></p>
          <p><strong>Client ID:</strong> <code>${CLIENT_ID || 'Not set (use env var)'}</code></p>
          <p><strong>Port:</strong> <code>${PORT}</code></p>
        </div>
      </body>
    </html>
  `);
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
    
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const scope = 'openid offline';
    
    const authUrl = `${HYDRA_PUBLIC_URL}/oauth2/auth?` +
      `client_id=${encodeURIComponent(CLIENT_ID)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;

    // Store state in cookie for verification
    c.header('Set-Cookie', `oauth_state=${state}; HttpOnly; Max-Age=600; Path=/`);
    
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
  
  // Get state from cookie
  const cookieHeader = c.req.header('Cookie') || '';
  const stateMatch = cookieHeader.match(/oauth_state=([^;]+)/);
  const storedState = stateMatch ? stateMatch[1] : null;

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
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h1>State Mismatch</h1>
          <p>State parameter does not match. Possible CSRF attack.</p>
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
    const tokenResponse = await fetch(`${HYDRA_PUBLIC_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
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
    const API_URL = 'https://api.dev.workstream.us/hris/v1/jobs';
    let apiResult = null;
    let apiError = null;
    
    try {
      const apiResponse = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
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
          <div class="api-test ${apiResult?.success ? 'success' : apiError ? 'error' : 'error'}">
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
          
          <h2>Authorization Code:</h2>
          <pre>${code}</pre>
          
          <h2>cURL Command for Manual Testing:</h2>
          <pre>curl -X POST '${HYDRA_PUBLIC_URL}/oauth2/token' \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d 'grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}'</pre>
          
          ${apiResult?.success ? `
          <h2>cURL Command to Test API:</h2>
          <pre>curl -X GET '${API_URL}' \\
  -H 'Authorization: Bearer ${tokenData.access_token}' \\
  -H 'Content-Type: application/json'</pre>
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
      return c.json({ error: data.error || 'Failed to request device code', ...data }, response.status);
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
    return c.json(data, response.status);
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

