#!/usr/bin/env bun
/**
 * Create OAuth2 Client in Ory Hydra
 * 
 * Usage:
 *   bun run src/scripts/create-client.ts
 * 
 * Or with custom values:
 *   HYDRA_ADMIN_URL=https://hydra-admin.priv.dev.workstream.is bun run src/scripts/create-client.ts
 */

export {};

const CREATE_HYDRA_ADMIN_URL = process.env.HYDRA_ADMIN_URL || 'https://hydra-admin.priv.dev.workstream.is';
const CREATE_REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/callback';

const createClientConfig = {
  client_name: 'Workstream OAuth Demo Client',
  grant_types: [
    'authorization_code',
    'urn:ietf:params:oauth:grant-type:device_code',
    'client_credentials'
  ],
  response_types: ['code'],
  scope: 'openid offline',
  redirect_uris: [CREATE_REDIRECT_URI],
  token_endpoint_auth_method: 'client_secret_post'
};

console.log('🔐 Creating OAuth2 Client in Ory Hydra\n');
console.log('Configuration:');
console.log(`  Admin URL: ${CREATE_HYDRA_ADMIN_URL}`);
console.log(`  Redirect URI: ${CREATE_REDIRECT_URI}\n`);
console.log('Client Config:');
console.log(JSON.stringify(createClientConfig, null, 2));
console.log('\n');

try {
  const response = await fetch(`${CREATE_HYDRA_ADMIN_URL}/admin/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createClientConfig),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error creating client:');
    console.error(`  Status: ${response.status} ${response.statusText}`);
    console.error(`  Response: ${errorText}`);
    process.exit(1);
  }

  const client = await response.json();
  
  console.log('✅ OAuth2 Client created successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 Client Details:\n');
  console.log(`  Client ID:     ${client.client_id}`);
  console.log(`  Client Secret: ${client.client_secret || 'N/A'}`);
  console.log(`  Client Name:   ${client.client_name || createClientConfig.client_name}`);
  console.log(`  Grant Types:   ${client.grant_types?.join(', ') || createClientConfig.grant_types.join(', ')}`);
  console.log(`  Redirect URIs: ${client.redirect_uris?.join(', ') || createClientConfig.redirect_uris.join(', ')}`);
  console.log(`  Scopes:        ${client.scope || createClientConfig.scope}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 Next Steps:\n');
  console.log('1. Update your .env file with these credentials:');
  console.log(`   CLIENT_ID=${client.client_id}`);
  console.log(`   CLIENT_SECRET=${client.client_secret || 'your-secret'}\n`);
  console.log('2. Or run this command to update .env automatically:');
  console.log(`   echo "CLIENT_ID=${client.client_id}" >> .env`);
  console.log(`   echo "CLIENT_SECRET=${client.client_secret || 'your-secret'}" >> .env\n`);
  
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
  console.error('\n💡 Troubleshooting:');
  console.error('  - Check if you have network access to the Hydra admin endpoint');
  console.error('  - Verify the HYDRA_ADMIN_URL is correct');
  console.error('  - Check if authentication is required (add headers if needed)');
  console.error('  - Try running from a different network/VPN if applicable\n');
  process.exit(1);
}

