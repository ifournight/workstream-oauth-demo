#!/bin/bash

# Simple script to update OAuth client redirect URIs using jq
# Usage: ./scripts/update-client-simple.sh

set -e

HYDRA_ADMIN_URL="${HYDRA_ADMIN_URL:-https://hydra-admin.priv.dev.workstream.is}"
CLIENT_ID="${CLIENT_ID:-6606cf1f-416d-4de1-b4c4-10fbf2cdd7d0}"

echo "🔐 Updating OAuth2 Client redirect_uris"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Configuration:"
echo "  Admin URL: ${HYDRA_ADMIN_URL}"
echo "  Client ID: ${CLIENT_ID}"
echo ""

# Step 1: Get current client
echo "Step 1: Fetching current client configuration..."
CLIENT_JSON=$(curl -s "${HYDRA_ADMIN_URL}/admin/clients/${CLIENT_ID}")

if [ -z "$CLIENT_JSON" ] || echo "$CLIENT_JSON" | grep -q "\"error\""; then
    echo "❌ Error fetching client:"
    echo "$CLIENT_JSON"
    exit 1
fi

echo "✅ Retrieved client data"
echo "Current redirect_uris:"
echo "$CLIENT_JSON" | python3 -m json.tool | grep -A 10 "redirect_uris" || echo "$CLIENT_JSON" | grep -o '"redirect_uris":\[[^]]*\]'
echo ""

# Step 2: Update redirect URIs
echo "Step 2: Updating redirect URIs..."

# Check if jq is available
if command -v jq &> /dev/null; then
    echo "Using jq to update JSON..."
    UPDATED_JSON=$(echo "$CLIENT_JSON" | jq '.redirect_uris += ["http://localhost:3000/api/auth/callback", "https://workstream-oauth-demo.vercel.app/api/auth/callback"] | .redirect_uris |= unique')
else
    echo "jq not found, using Python..."
    # Use Python to update JSON
    UPDATED_JSON=$(echo "$CLIENT_JSON" | python3 <<'PYTHON'
import json
import sys

client = json.load(sys.stdin)

# Get existing redirect URIs
existing_uris = client.get("redirect_uris", []) or []

# New callback URLs to add
new_callback_1 = "http://localhost:3000/api/auth/callback"
new_callback_2 = "https://workstream-oauth-demo.vercel.app/api/auth/callback"

# Remove old callback URLs and add new ones
# Remove old ones if they exist
existing_uris = [uri for uri in existing_uris if uri not in [
    "http://localhost:3000/callback",
    "https://workstream-oauth-demo.vercel.app/callback"
]]

# Add new URIs if not already present
if new_callback_1 not in existing_uris:
    existing_uris.append(new_callback_1)
if new_callback_2 not in existing_uris:
    existing_uris.append(new_callback_2)

# Update client data
client["redirect_uris"] = existing_uris

# Output updated JSON
print(json.dumps(client))
PYTHON
)
fi

echo "New redirect_uris:"
echo "$UPDATED_JSON" | python3 -m json.tool | grep -A 10 "redirect_uris" || echo "$UPDATED_JSON" | grep -o '"redirect_uris":\[[^]]*\]'
echo ""

# Step 3: Update client
echo "Step 3: Updating client configuration..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
    "${HYDRA_ADMIN_URL}/admin/clients/${CLIENT_ID}" \
    -H "Content-Type: application/json" \
    -d "$UPDATED_JSON")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ Client updated successfully! (HTTP $HTTP_CODE)"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Updated Client Details:"
    echo "$RESPONSE_BODY" | python3 -m json.tool | grep -E "(client_id|client_name|redirect_uris)" | head -15
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "❌ Error updating client (HTTP $HTTP_CODE):"
    echo "$RESPONSE_BODY"
    exit 1
fi


