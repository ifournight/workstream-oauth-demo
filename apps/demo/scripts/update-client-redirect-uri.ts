#!/usr/bin/env bun
/**
 * Update OAuth2 Client redirect_uris to include /api/auth/callback for login flow
 * 
 * Usage:
 *   bun run scripts/update-client-redirect-uri.ts
 * 
 * Or with custom values:
 *   CLIENT_ID=your-client-id HYDRA_ADMIN_URL=https://hydra-admin.priv.dev.workstream.is bun run scripts/update-client-redirect-uri.ts
 */

export {};

const UPDATE_HYDRA_ADMIN_URL = process.env.HYDRA_ADMIN_URL || 'https://hydra-admin.priv.dev.workstream.is';
const UPDATE_CLIENT_ID = process.env.CLIENT_ID || '6606cf1f-416d-4de1-b4c4-10fbf2cdd7d0';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

console.log('🔐 Updating OAuth2 Client redirect_uris in Ory Hydra\n');
console.log('Configuration:');
console.log(`  Admin URL: ${UPDATE_HYDRA_ADMIN_URL}`);
console.log(`  Client ID: ${UPDATE_CLIENT_ID}`);
console.log(`  Base URL: ${BASE_URL}\n`);

try {
  // First, get the current client configuration
  console.log('📥 Fetching current client configuration...\n');
  const getResponse = await fetch(`${UPDATE_HYDRA_ADMIN_URL}/admin/clients/${UPDATE_CLIENT_ID}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!getResponse.ok) {
    const errorText = await getResponse.text();
    console.error('❌ Error fetching client:');
    console.error(`  Status: ${getResponse.status} ${getResponse.statusText}`);
    console.error(`  Response: ${errorText}`);
    process.exit(1);
  }

  const currentClient = await getResponse.json();
  console.log('📋 Current Client Configuration:');
  console.log(`  Redirect URIs: ${currentClient.redirect_uris?.join(', ') || 'None'}\n`);

  // Prepare updated redirect URIs - add /api/auth/callback if not already present
  const existingRedirectUris = currentClient.redirect_uris || [];
  const newRedirectUri = `${BASE_URL}/api/auth/callback`;

  // Combine existing URIs with new one, removing duplicates
  const updatedRedirectUris = [
    ...new Set([
      ...existingRedirectUris,
      newRedirectUri,
    ])
  ];

  console.log('📝 Updated Redirect URIs:');
  updatedRedirectUris.forEach(uri => console.log(`  - ${uri}`));
  console.log('');

  // Prepare update payload - preserve all existing fields
  const updateClientConfig = {
    ...currentClient,
    redirect_uris: updatedRedirectUris,
  };

  // Update the client
  console.log('📤 Updating client configuration...\n');
  const updateResponse = await fetch(`${UPDATE_HYDRA_ADMIN_URL}/admin/clients/${UPDATE_CLIENT_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateClientConfig),
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    console.error('❌ Error updating client:');
    console.error(`  Status: ${updateResponse.status} ${updateResponse.statusText}`);
    console.error(`  Response: ${errorText}`);
    process.exit(1);
  }

  const updatedClient = await updateResponse.json();
  
  console.log('✅ OAuth2 Client updated successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 Updated Client Details:\n');
  console.log(`  Client ID:     ${updatedClient.client_id || UPDATE_CLIENT_ID}`);
  console.log(`  Client Name:   ${updatedClient.client_name || 'N/A'}`);
  console.log(`  Grant Types:   ${updatedClient.grant_types?.join(', ') || 'N/A'}`);
  console.log(`  Redirect URIs: ${updatedClient.redirect_uris?.join(', ') || 'N/A'}`);
  console.log(`  Scopes:        ${updatedClient.scope || 'N/A'}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Client now supports login flow callback route!\n');
  console.log('💡 Login flow will use:');
  console.log(`   - ${newRedirectUri}\n`);
  
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
