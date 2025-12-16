#!/usr/bin/env bun
/**
 * Authorization Code Flow Demo
 * 
 * This script demonstrates the Authorization Code flow using curl commands.
 * Run this after setting up your OAuth client in Hydra.
 */

const DEMO_HYDRA_PUBLIC_URL = process.env.HYDRA_PUBLIC_URL || 'https://hydra-public.priv.dev.workstream.is';
const DEMO_CLIENT_ID = process.env.CLIENT_ID || '';
const DEMO_CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const DEMO_REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/callback';

if (!DEMO_CLIENT_ID || !DEMO_CLIENT_SECRET) {
  console.error('❌ Error: CLIENT_ID and CLIENT_SECRET must be set');
  console.error('   Set them as environment variables:');
  console.error('   export CLIENT_ID="your-client-id"');
  console.error('   export CLIENT_SECRET="your-client-secret"');
  process.exit(1);
}

console.log('🔐 Authorization Code Flow Demo\n');
console.log('Configuration:');
console.log(`  Hydra URL: ${DEMO_HYDRA_PUBLIC_URL}`);
console.log(`  Client ID: ${DEMO_CLIENT_ID}`);
console.log(`  Redirect URI: ${DEMO_REDIRECT_URI}\n`);

// Generate state for CSRF protection
const authState = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const authScope = 'openid offline';

// Step 1: Construct authorization URL
const authorizationUrl = `${DEMO_HYDRA_PUBLIC_URL}/oauth2/auth?` +
  `client_id=${encodeURIComponent(DEMO_CLIENT_ID)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(authScope)}&` +
  `redirect_uri=${encodeURIComponent(DEMO_REDIRECT_URI)}&` +
  `state=${authState}`;

console.log('📋 Step 1: Authorization Request');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\nVisit this URL in your browser:\n');
console.log(authorizationUrl);
console.log('\nOr use curl to get the redirect:\n');
console.log(`curl -L "${authorizationUrl}"\n`);

console.log('📋 Step 2: After Authorization');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('You will be redirected to:');
console.log(`${DEMO_REDIRECT_URI}?code=AUTHORIZATION_CODE&state=${authState}\n`);
console.log('Extract the authorization code from the URL parameter.\n');

console.log('📋 Step 3: Exchange Authorization Code for Tokens');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Use this curl command (replace AUTHORIZATION_CODE with the actual code):\n');
console.log(`curl -X POST '${DEMO_HYDRA_PUBLIC_URL}/oauth2/token' \\`);
console.log(`  -H 'Content-Type: application/x-www-form-urlencoded' \\`);
console.log(`  -d 'grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=${encodeURIComponent(DEMO_REDIRECT_URI)}&client_id=${DEMO_CLIENT_ID}&client_secret=${DEMO_CLIENT_SECRET}'\n`);

console.log('📋 Alternative: Using Basic Auth');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`curl -X POST '${DEMO_HYDRA_PUBLIC_URL}/oauth2/token' \\`);
console.log(`  -u '${DEMO_CLIENT_ID}:${DEMO_CLIENT_SECRET}' \\`);
console.log(`  -H 'Content-Type: application/x-www-form-urlencoded' \\`);
console.log(`  -d 'grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=${encodeURIComponent(DEMO_REDIRECT_URI)}'\n`);

console.log('💡 Tip: The local server at http://localhost:3000 will automatically handle the callback');
console.log('   and exchange the code for tokens. Just visit the authorization URL above!\n');

