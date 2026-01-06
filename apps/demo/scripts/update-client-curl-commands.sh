#!/bin/bash

# Direct curl commands to update OAuth client redirect URIs
# Copy and paste these commands one by one, or run this script

HYDRA_ADMIN_URL="https://hydra-admin.priv.dev.workstream.is"
CLIENT_ID="6606cf1f-416d-4de1-b4c4-10fbf2cdd7d0"

echo "Step 1: Fetching all OAuth clients..."
echo "Command:"
echo "curl -s \"${HYDRA_ADMIN_URL}/admin/clients\""
echo ""
curl -s "${HYDRA_ADMIN_URL}/admin/clients" | python3 -m json.tool 2>/dev/null || curl -s "${HYDRA_ADMIN_URL}/admin/clients"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Step 2: Fetching client ${CLIENT_ID}..."
echo "Command:"
echo "curl -s \"${HYDRA_ADMIN_URL}/admin/clients/${CLIENT_ID}\""
echo ""
CLIENT_JSON=$(curl -s "${HYDRA_ADMIN_URL}/admin/clients/${CLIENT_ID}")
echo "$CLIENT_JSON" | python3 -m json.tool 2>/dev/null || echo "$CLIENT_JSON"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Step 3: Updating client with new redirect URIs..."
echo ""

# Save client JSON to temp file for Python processing
TEMP_FILE=$(mktemp)
echo "$CLIENT_JSON" > "$TEMP_FILE"

# Create updated JSON with new redirect URIs
UPDATED_JSON=$(python3 <<PYTHON_SCRIPT
import json
import sys

with open("$TEMP_FILE", "r") as f:
    client = json.load(f)

# Get existing redirect URIs
existing_uris = client.get("redirect_uris", []) or []

# New callback URLs to add
new_callback_1 = "http://localhost:3000/api/auth/callback"
new_callback_2 = "https://workstream-oauth-demo.vercel.app/api/auth/callback"

# Add new URIs if not already present
if new_callback_1 not in existing_uris:
    existing_uris.append(new_callback_1)
if new_callback_2 not in existing_uris:
    existing_uris.append(new_callback_2)

# Update client data
client["redirect_uris"] = existing_uris

# Output updated JSON
print(json.dumps(client))
PYTHON_SCRIPT
)

# Clean up temp file
rm "$TEMP_FILE"

echo "Current redirect URIs:"
echo "$CLIENT_JSON" | python3 -m json.tool | grep -A 5 "redirect_uris" || echo "  None"
echo ""
echo "New redirect URIs to add:"
echo "  - http://localhost:3000/api/auth/callback"
echo "  - https://workstream-oauth-demo.vercel.app/api/auth/callback"
echo ""
echo "Updated JSON payload:"
echo "$UPDATED_JSON" | python3 -m json.tool
echo ""
echo "Executing update..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
    "${HYDRA_ADMIN_URL}/admin/clients/${CLIENT_ID}" \
    -H "Content-Type: application/json" \
    -d "$UPDATED_JSON")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ Client updated successfully! (HTTP $HTTP_CODE)"
    echo ""
    echo "Updated client data:"
    echo "$RESPONSE_BODY" | python3 -m json.tool
else
    echo "❌ Error updating client (HTTP $HTTP_CODE):"
    echo "$RESPONSE_BODY"
    exit 1
fi

