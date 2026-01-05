# Debugging Guide

This guide explains how to debug the OAuth flow, especially the redirect URI generation issue.

## Local Debugging

### Option 1: Standard Next.js Dev Server

```bash
cd apps/demo
bun run dev
```

The app will run on `http://localhost:3000`. Check the console logs when accessing `/api/auth/login`.

### Option 2: Vercel CLI (Recommended for Vercel-like Environment)

Vercel CLI allows you to run your app locally with Vercel's runtime environment, which helps debug production issues.

#### Installation

```bash
# Install Vercel CLI globally
npm i -g vercel

# Or use bun
bun add -g vercel
```

#### Setup

1. **Login to Vercel** (if not already logged in):
   ```bash
   vercel login
   ```

2. **Link your project** (optional, for pulling environment variables):
   ```bash
   cd apps/demo
   vercel link
   ```
   This will prompt you to select your Vercel project and pull environment variables.

3. **Run locally with Vercel environment**:
   ```bash
   vercel dev
   ```
   
   This will:
   - Use Vercel's runtime environment
   - Load environment variables from Vercel (if linked)
   - Simulate Vercel's request headers (x-forwarded-host, x-forwarded-proto)
   - Run on a local port (usually 3000)

#### Debugging with Vercel CLI

When running `vercel dev`, you'll see:
- Server logs in the terminal
- Request/response logs
- Environment variable values
- Headers being sent/received

Check the console output when accessing `/api/auth/login` to see:
- The base URL being extracted
- Headers available
- The final redirect URI

## Vercel Production Debugging

### View Function Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `workstream-oauth-demo`
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click on **Functions** tab
6. Click on `/api/auth/login` function
7. View the **Logs** section

You should see logs like:
```
[Login API] Base URL extraction: {
  baseUrl: 'https://workstream-oauth-demo.vercel.app',
  redirectUri: 'https://workstream-oauth-demo.vercel.app/api/auth/callback',
  ...
}
```

### Enable Debug Logging

To see more detailed logs in production, add this environment variable in Vercel:

1. Go to **Project Settings** → **Environment Variables**
2. Add: `DEBUG_BASE_URL=true`
3. Redeploy

This will enable additional logging in the `getBaseUrl` function.

### Check Request Headers

The logs will show what headers are available. In Vercel, you should see:
- `x-forwarded-host`: `workstream-oauth-demo.vercel.app`
- `x-forwarded-proto`: `https`
- `host`: May also be present

## Common Issues

### Issue: redirect_uri is empty or localhost

**Symptoms:**
- Redirect URI in Hydra authorization URL is empty or `http://localhost:3000/api/auth/callback`

**Possible Causes:**
1. Headers not being passed correctly
2. `getBaseUrl` function not receiving request object
3. Environment variable `NEXT_PUBLIC_BASE_URL` not set (but should fallback to headers)

**Debug Steps:**
1. Check Vercel Function Logs (see above)
2. Look for `[Login API] Base URL extraction` log entry
3. Check if `baseUrl` is correct
4. Verify headers are present

### Issue: Headers are missing

If headers are missing in Vercel:
1. Check if you're using Next.js App Router (which we are)
2. Verify the request is coming through Vercel's edge network
3. Check if there's a proxy or CDN in front that might strip headers

### Quick Fix: Set Environment Variable

If dynamic detection isn't working, you can set `NEXT_PUBLIC_BASE_URL` in Vercel:

1. Go to **Project Settings** → **Environment Variables**
2. Add: `NEXT_PUBLIC_BASE_URL=https://workstream-oauth-demo.vercel.app`
3. Redeploy

This will bypass the dynamic detection and use the fixed URL.

## Testing the Fix

After making changes:

1. **Local testing:**
   ```bash
   vercel dev
   # Visit http://localhost:3000/login
   # Check console logs
   ```

2. **Production testing:**
   - Push changes to GitHub
   - Wait for Vercel deployment
   - Visit https://workstream-oauth-demo.vercel.app/login
   - Check Vercel Function Logs
   - Inspect the Hydra authorization URL to verify redirect_uri

## Inspecting the Authorization URL

When you click "Login", you'll be redirected to Hydra. The URL will look like:
```
https://hydra-public.priv.dev.workstream.is/oauth2/auth?
  client_id=...&
  redirect_uri=https://workstream-oauth-demo.vercel.app/api/auth/callback&
  ...
```

Check that `redirect_uri` parameter is:
- ✅ Present and not empty
- ✅ Uses `https://` (not `http://`)
- ✅ Points to your Vercel domain
- ✅ Includes `/api/auth/callback` path

If any of these are wrong, check the logs to see what `baseUrl` was extracted.

