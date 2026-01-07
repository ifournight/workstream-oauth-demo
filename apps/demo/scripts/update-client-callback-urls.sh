#!/bin/bash

# Script to update OAuth client redirect URIs
# Usage: ./scripts/update-client-callback-urls.sh

set -e

HYDRA_ADMIN_URL="${HYDRA_ADMIN_URL:-https://hydra-admin.priv.dev.workstream.is}"
CLIENT_ID="${CLIENT_ID:-6606cf1f-416d-4de1-b4c4-10fbf2cdd7d0}"

echo "🔐 Updating OAuth2 Client redirect_uris"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Configuration:"
echo "  Admin URL: ${HYDRA_ADMIN_URL}"
echo "  Client ID: ${CLIENT_ID}"
echo ""

# Step 1: Fetch all clients
echo "Step 1: Fetching all OAuth clients..."
ALL_CLIENTS=$(curl -s "${HYDRA_ADMIN_URL}/admin/clients")
echo "✅ Retrieved all clients"
echo ""

# Step 2: Get specific client
echo "Step 2: Fetching client ${CLIENT_ID}..."
CLIENT_DATA=$(curl -s "${HYDRA_ADMIN_URL}/admin/clients/${CLIENT_ID}")

if [ -z "$CLIENT_DATA" ] || echo "$CLIENT_DATA" | grep -q "error"; then
    echo "❌ Error fetching client:"
    echo "$CLIENT_DATA"
    exit 1
fi

echo "✅ Retrieved client data"
echo ""

# Step 3: Extract current redirect_uris and add new ones
echo "Step 3: Preparing updated redirect URIs..."

# Save client data to temp file for processing
TEMP_FILE=$(mktemp)
echo "$CLIENT_DATA" > "$TEMP_FILE"

# New callback URLs to add
NEW_CALLBACK_1="http://localhost:3000/api/auth/callback"
NEW_CALLBACK_2="https://workstream-oauth-demo.vercel.app/api/auth/callback"

# Use Python to process JSON (more reliable than shell)
UPDATED_JSON=$(python3 <<EOF
import json
import sys

with open("$TEMP_FILE", "r") as f:
    client = json.load(f)

# Get existing redirect URIs
existing_uris = client.get("redirect_uris", []) or []

# Add new URIs if not already present
new_uris = list(existing_uris)
if "$NEW_CALLBACK_1" not in new_uris:
    new_uris.append("$NEW_CALLBACK_1")
if "$NEW_CALLBACK_2" not in new_uris:
    new_uris.append("$NEW_CALLBACK_2")

# Update client data
client["redirect_uris"] = new_uris

# Output updated JSON
print(json.dumps(client, indent=2))
EOF
)

rm "$TEMP_FILE"

echo "Current redirect URIs:"
echo "$CLIENT_DATA" | python3 -m json.tool | grep -A 10 "redirect_uris" || echo "  None"
echo ""
echo "New redirect URIs to add:"
echo "  - $NEW_CALLBACK_1"
echo "  - $NEW_CALLBACK_2"
echo ""

# Step 4: Update client
echo "Step 4: Updating client configuration..."
UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
    "${HYDRA_ADMIN_URL}/admin/clients/${CLIENT_ID}" \
    -H "Content-Type: application/json" \
    -d "$UPDATED_JSON")

HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$UPDATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ Client updated successfully!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Updated Client Details:"
    echo "$RESPONSE_BODY" | python3 -m json.tool | grep -E "(client_id|client_name|redirect_uris)" | head -10
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "❌ Error updating client:"
    echo "  HTTP Status: $HTTP_CODE"
    echo "  Response: $RESPONSE_BODY"
    exit 1
fi


