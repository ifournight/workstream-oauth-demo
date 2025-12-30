#!/usr/bin/env bun
/**
 * Update OAuth2 Client to add client_credentials grant type
 * 
 * Usage:
 *   bun run scripts/update-client.ts
 * 
 * Or with custom values:
 *   CLIENT_ID=your-client-id HYDRA_ADMIN_URL=https://hydra-admin.priv.dev.workstream.is bun run scripts/update-client.ts
 */

export {};

const UPDATE_HYDRA_ADMIN_URL = process.env.HYDRA_ADMIN_URL || 'https://hydra-admin.priv.dev.workstream.is';
const UPDATE_CLIENT_ID = process.env.CLIENT_ID || '6606cf1f-416d-4de1-b4c4-10fbf2cdd7d0';
const UPDATE_REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/callback';

const updateClientConfig = {
  grant_types: [
    'authorization_code',
    'urn:ietf:params:oauth:grant-type:device_code',
    'client_credentials'
  ],
  response_types: ['code'],
  scope: 'openid offline',
  redirect_uris: [UPDATE_REDIRECT_URI],
  token_endpoint_auth_method: 'client_secret_post'
};

console.log('🔐 Updating OAuth2 Client in Ory Hydra\n');
console.log('Configuration:');
console.log(`  Admin URL: ${UPDATE_HYDRA_ADMIN_URL}`);
console.log(`  Client ID: ${UPDATE_CLIENT_ID}`);
console.log(`  Redirect URI: ${UPDATE_REDIRECT_URI}\n`);
console.log('Updated Client Config:');
console.log(JSON.stringify(updateClientConfig, null, 2));
console.log('\n');

try {
  const response = await fetch(`${UPDATE_HYDRA_ADMIN_URL}/admin/clients/${UPDATE_CLIENT_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateClientConfig),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error updating client:');
    console.error(`  Status: ${response.status} ${response.statusText}`);
    console.error(`  Response: ${errorText}`);
    process.exit(1);
  }

  const client = await response.json();
  
  console.log('✅ OAuth2 Client updated successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 Updated Client Details:\n');
  console.log(`  Client ID:     ${client.client_id || UPDATE_CLIENT_ID}`);
  console.log(`  Client Name:   ${client.client_name || 'N/A'}`);
  console.log(`  Grant Types:   ${client.grant_types?.join(', ') || updateClientConfig.grant_types.join(', ')}`);
  console.log(`  Redirect URIs: ${client.redirect_uris?.join(', ') || updateClientConfig.redirect_uris.join(', ')}`);
  console.log(`  Scopes:        ${client.scope || updateClientConfig.scope}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Client now supports Client Credentials flow!\n');
  console.log('💡 You can now test the Client Credentials flow at:');
  console.log('   http://localhost:3000/client-credentials-demo\n');
  
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
  console.error('\n💡 Troubleshooting:');
  console.error('  - Check if you have network access to the Hydra admin endpoint');
  console.error('  - Verify the HYDRA_ADMIN_URL is correct');
  console.error('  - Make sure you are connected to VPN if required');
  console.error('  - Check if authentication is required (add headers if needed)');
  console.error('  - Verify the CLIENT_ID is correct\n');
  process.exit(1);
}

