#!/usr/bin/env bun
/**
 * Test OAuth flow and API call
 * 
 * This script:
 * 1. Gets an access token via Authorization Code flow
 * 2. Uses the token to call the Workstream API
 * 
 * Usage:
 *   bun run src/scripts/test-api.ts
 */

export {};

const TEST_HYDRA_PUBLIC_URL = process.env.HYDRA_PUBLIC_URL || 'https://hydra-public.priv.dev.workstream.is';
const TEST_CLIENT_ID = process.env.CLIENT_ID || '';
const TEST_CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const TEST_REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/callback';
const TEST_API_URL = process.env.TEST_API_URL || 'https://ws-public-api.dev.workstream.us/time-shift/v2/public/managers/time_entries?startDate=2025-12-22&endDate=2025-12-29&locationIds%5B0%5D=b6f3d953-5ce1-4395-9c25-080b451168fa&statuses%5B0%5D=ended&statuses%5B1%5D=approved&statuses%5B2%5D=started&sortField=clockIn&sortOrder=desc&limit=50';

if (!TEST_CLIENT_ID || !TEST_CLIENT_SECRET) {
  console.error('❌ Error: CLIENT_ID and CLIENT_SECRET must be set');
  console.error('   Make sure your .env file is configured');
  process.exit(1);
}

console.log('🔐 OAuth Flow Test - Getting Access Token\n');
console.log('Configuration:');
console.log(`  Client ID: ${TEST_CLIENT_ID}`);
console.log(`  Hydra URL: ${TEST_HYDRA_PUBLIC_URL}`);
console.log(`  API URL: ${TEST_API_URL}\n`);

// Step 1: Get authorization URL
const testState = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const testScope = 'openid offline';
const testAuthUrl = `${TEST_HYDRA_PUBLIC_URL}/oauth2/auth?` +
  `client_id=${encodeURIComponent(TEST_CLIENT_ID)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(testScope)}&` +
  `redirect_uri=${encodeURIComponent(TEST_REDIRECT_URI)}&` +
  `state=${testState}`;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📋 Step 1: Authorization Request\n');
console.log('Visit this URL in your browser to authorize:');
console.log(`\n${testAuthUrl}\n`);
console.log('After authorization, you will be redirected to:');
console.log(`${TEST_REDIRECT_URI}?code=AUTHORIZATION_CODE&state=${testState}\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Wait for user input
console.log('⏳ Please complete the authorization in your browser...\n');
console.log('After you see the callback page with tokens, please:');
console.log('1. Copy the authorization code from the callback URL');
console.log('2. Run this script again with the code as an argument:');
console.log(`   bun run src/scripts/test-api.ts <authorization_code>\n`);

// If authorization code is provided as argument
const authCode = process.argv[2];

if (authCode) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 Step 2: Exchange Authorization Code for Access Token\n');
  
  try {
    const tokenResponse = await fetch(`${TEST_HYDRA_PUBLIC_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        client_secret: TEST_CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed:');
      console.error(JSON.stringify(tokenData, null, 2));
      process.exit(1);
    }

    console.log('✅ Access token received!\n');
    console.log('Token Details:');
    console.log(`  Access Token: ${tokenData.access_token.substring(0, 50)}...`);
    console.log(`  Token Type: ${tokenData.token_type}`);
    console.log(`  Expires In: ${tokenData.expires_in} seconds`);
    if (tokenData.refresh_token) {
      console.log(`  Refresh Token: ${tokenData.refresh_token.substring(0, 50)}...`);
    }
    console.log(`  Scope: ${tokenData.scope}\n`);

    // Step 3: Call the API
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Step 3: Calling Workstream API\n');
    console.log(`GET ${TEST_API_URL}\n`);

    const apiResponse = await fetch(TEST_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response Status: ${apiResponse.status} ${apiResponse.statusText}\n`);

    if (apiResponse.status === 401) {
      console.error('❌ Authentication failed! Got 401 Unauthorized.');
      console.error('   The access token may be invalid or expired.');
      const errorText = await apiResponse.text();
      console.error(`   Response: ${errorText}\n`);
      process.exit(1);
    }

    if (!apiResponse.ok) {
      console.error(`❌ API call failed with status ${apiResponse.status}`);
      const errorText = await apiResponse.text();
      console.error(`   Response: ${errorText}\n`);
      process.exit(1);
    }

    const apiData = await apiResponse.json();
    console.log('✅ API call successful! Authentication is working!\n');
    console.log('API Response:');
    console.log(JSON.stringify(apiData, null, 2));
    console.log('\n🎉 OAuth flow verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
} else {
  console.log('💡 Tip: You can also use the web UI at http://localhost:3000');
  console.log('   It will automatically handle the callback and show you the tokens.\n');
}

