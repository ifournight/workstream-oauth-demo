#!/usr/bin/env bun
/**
 * Authorization Code Flow Demo
 * 
 * This script demonstrates the Authorization Code flow using curl commands.
 * Run this after setting up your OAuth client in Hydra.
 */

const HYDRA_PUBLIC_URL = process.env.HYDRA_PUBLIC_URL || 'https://hydra-public.priv.dev.workstream.is';
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: CLIENT_ID and CLIENT_SECRET must be set');
  console.error('   Set them as environment variables:');
  console.error('   export CLIENT_ID="your-client-id"');
  console.error('   export CLIENT_SECRET="your-client-secret"');
  process.exit(1);
}

console.log('🔐 Authorization Code Flow Demo\n');
console.log('Configuration:');
console.log(`  Hydra URL: ${HYDRA_PUBLIC_URL}`);
console.log(`  Client ID: ${CLIENT_ID}`);
console.log(`  Redirect URI: ${REDIRECT_URI}\n`);

// Generate state for CSRF protection
const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const scope = 'openid offline';

// Step 1: Construct authorization URL
const authUrl = `${HYDRA_PUBLIC_URL}/oauth2/auth?` +
  `client_id=${encodeURIComponent(CLIENT_ID)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(scope)}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `state=${state}`;

console.log('📋 Step 1: Authorization Request');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\nVisit this URL in your browser:\n');
console.log(authUrl);
console.log('\nOr use curl to get the redirect:\n');
console.log(`curl -L "${authUrl}"\n`);

console.log('📋 Step 2: After Authorization');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('You will be redirected to:');
console.log(`${REDIRECT_URI}?code=AUTHORIZATION_CODE&state=${state}\n`);
console.log('Extract the authorization code from the URL parameter.\n');

console.log('📋 Step 3: Exchange Authorization Code for Tokens');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Use this curl command (replace AUTHORIZATION_CODE with the actual code):\n');
console.log(`curl -X POST '${HYDRA_PUBLIC_URL}/oauth2/token' \\`);
console.log(`  -H 'Content-Type: application/x-www-form-urlencoded' \\`);
console.log(`  -d 'grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}'\n`);

console.log('📋 Alternative: Using Basic Auth');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`curl -X POST '${HYDRA_PUBLIC_URL}/oauth2/token' \\`);
console.log(`  -u '${CLIENT_ID}:${CLIENT_SECRET}' \\`);
console.log(`  -H 'Content-Type: application/x-www-form-urlencoded' \\`);
console.log(`  -d 'grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=${encodeURIComponent(REDIRECT_URI)}'\n`);

console.log('💡 Tip: The local server at http://localhost:3000 will automatically handle the callback');
console.log('   and exchange the code for tokens. Just visit the authorization URL above!\n');

