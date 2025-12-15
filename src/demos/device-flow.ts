#!/usr/bin/env bun
/**
 * Device Authorization Flow Demo
 * 
 * This script demonstrates the Device Authorization flow (RFC 8628).
 * It requests device/user codes and polls for tokens.
 */

const HYDRA_PUBLIC_URL = process.env.HYDRA_PUBLIC_URL || 'https://hydra-public.priv.dev.workstream.is';
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: CLIENT_ID and CLIENT_SECRET must be set');
  console.error('   Set them as environment variables:');
  console.error('   export CLIENT_ID="your-client-id"');
  console.error('   export CLIENT_SECRET="your-client-secret"');
  process.exit(1);
}

console.log('📱 Device Authorization Flow Demo\n');
console.log('Configuration:');
console.log(`  Hydra URL: ${HYDRA_PUBLIC_URL}`);
console.log(`  Client ID: ${CLIENT_ID}\n`);

async function requestDeviceCode() {
  console.log('📋 Step 1: Requesting Device and User Codes');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const curlCommand = `curl -X POST '${HYDRA_PUBLIC_URL}/oauth2/device/auth' \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d 'client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&scope=openid offline'`;
  
  console.log('cURL command:\n');
  console.log(curlCommand);
  console.log('\n');

  try {
    const response = await fetch(`${HYDRA_PUBLIC_URL}/oauth2/device/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'openid offline',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error requesting device code:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('✅ Device code received:\n');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    return data;
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

async function pollForToken(deviceCode: string, interval: number) {
  console.log('📋 Step 2: Polling for Access Token');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const curlCommand = `curl -X POST '${HYDRA_PUBLIC_URL}/oauth2/token' \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d 'grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=${deviceCode}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}'`;
  
  console.log('cURL command for polling:\n');
  console.log(curlCommand);
  console.log('\n');
  console.log('⏳ Polling every', interval, 'seconds...');
  console.log('   (Visit the verification URI and enter the user code to authorize)\n');

  let pollCount = 0;
  const maxPolls = 120; // 10 minutes max (assuming 5s interval)

  while (pollCount < maxPolls) {
    try {
      const response = await fetch(`${HYDRA_PUBLIC_URL}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: deviceCode,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        console.log('✅ Success! Access token received:\n');
        console.log(JSON.stringify(data, null, 2));
        return data;
      } else if (data.error === 'authorization_pending') {
        process.stdout.write(`\r⏳ Poll ${pollCount + 1}: Waiting for authorization...`);
      } else if (data.error === 'slow_down') {
        interval += 5;
        console.log(`\n⚠️  Slow down requested. Increasing interval to ${interval}s`);
      } else if (data.error === 'expired_token') {
        console.error('\n❌ Device code expired. Please start over.');
        process.exit(1);
      } else {
        console.error('\n❌ Error:', data.error_description || data.error);
        console.error(JSON.stringify(data, null, 2));
        process.exit(1);
      }

      pollCount++;
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    } catch (error) {
      console.error('\n❌ Error polling:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  console.error('\n❌ Timeout: Maximum polling attempts reached');
  process.exit(1);
}

async function main() {
  const deviceData = await requestDeviceCode();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('👤 User Action Required:');
  console.log(`   1. Visit: ${deviceData.verification_uri}`);
  console.log(`   2. Enter user code: ${deviceData.user_code}`);
  console.log(`   Or visit directly: ${deviceData.verification_uri_complete}`);
  console.log('\n');

  const interval = deviceData.interval || 5;
  await pollForToken(deviceData.device_code, interval);
  
  console.log('\n✅ Device Authorization Flow completed successfully!\n');
}

main().catch(console.error);

