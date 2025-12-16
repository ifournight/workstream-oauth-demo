#!/usr/bin/env bun
/**
 * Client Credentials Flow Demo
 * 
 * This flow is for machine-to-machine communication.
 * No user interaction required - just client_id and client_secret.
 * 
 * Usage:
 *   bun run src/demos/client-credentials-flow.ts
 */

const CC_HYDRA_PUBLIC_URL = process.env.HYDRA_PUBLIC_URL || 'https://oauth2.dev.workstream.us';
const CC_CLIENT_ID = process.env.CLIENT_ID || '';
const CC_CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const CC_API_URL = 'https://api.dev.workstream.us/hris/v1/jobs';

if (!CC_CLIENT_ID || !CC_CLIENT_SECRET) {
  console.error('❌ Error: CLIENT_ID and CLIENT_SECRET must be set');
  console.error('   Set them as environment variables:');
  console.error('   export CLIENT_ID="your-client-id"');
  console.error('   export CLIENT_SECRET="your-client-secret"');
  process.exit(1);
}

console.log('🔐 Client Credentials Flow Demo\n');
console.log('Configuration:');
console.log(`  Hydra URL: ${CC_HYDRA_PUBLIC_URL}`);
console.log(`  Client ID: ${CC_CLIENT_ID}`);
console.log(`  API URL: ${CC_API_URL}\n`);

async function getAccessToken() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 Step 1: Request Access Token\n');
  
  const curlCommand = `curl -X POST '${CC_HYDRA_PUBLIC_URL}/oauth2/token' \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d 'grant_type=client_credentials&client_id=${CC_CLIENT_ID}&client_secret=${CC_CLIENT_SECRET}&scope=openid offline'`;
  
  console.log('cURL command:\n');
  console.log(curlCommand);
  console.log('\n');

  try {
    const response = await fetch(`${CC_HYDRA_PUBLIC_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CC_CLIENT_ID,
        client_secret: CC_CLIENT_SECRET,
        scope: 'openid offline',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error getting access token:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('✅ Access token received:\n');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    return data.access_token;
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

async function testAPI(accessToken: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 Step 2: Test API Call\n');
  
  const curlCommand = `curl -X GET '${CC_API_URL}' \\
  -H 'Authorization: Bearer ${accessToken}' \\
  -H 'Content-Type: application/json'`;
  
  console.log('cURL command:\n');
  console.log(curlCommand);
  console.log('\n');

  try {
    const response = await fetch(CC_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response Status: ${response.status} ${response.statusText}\n`);

    if (response.status === 401) {
      console.error('❌ Authentication failed! Got 401 Unauthorized.');
      console.error('   The access token may be invalid or expired.');
      const errorText = await response.text();
      console.error(`   Response: ${errorText}\n`);
      process.exit(1);
    }

    if (!response.ok) {
      console.error(`❌ API call failed with status ${response.status}`);
      const errorText = await response.text();
      console.error(`   Response: ${errorText}\n`);
      process.exit(1);
    }

    const apiData = await response.json();
    console.log('✅ API call successful! Authentication is working!\n');
    console.log('API Response:');
    console.log(JSON.stringify(apiData, null, 2));
    console.log('\n🎉 Client Credentials flow verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

async function clientCredentialsMain() {
  const accessToken = await getAccessToken();
  await testAPI(accessToken);
}

clientCredentialsMain().catch(console.error);

