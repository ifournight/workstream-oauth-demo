# JWT `sub` Claim in Client Credentials Flow

## Your Assumption is Correct ✅

In **OAuth 2.0 Client Credentials Flow**, the `sub` (subject) claim in the JWT token **should be the client ID**, not a user identity ID.

## Why?

### Client Credentials Flow Characteristics:
- **No user involved**: This is a machine-to-machine flow
- **Client acts on its own behalf**: The client application itself is the subject
- **No user context**: There's no end-user authentication in this flow

### OAuth 2.0 Specification:

According to **RFC 7523** (JWT Profile for OAuth 2.0 Client Authentication and Authorization Grants):
> The `sub` claim **must be the `client_id`** of the OAuth client when used for client authentication.

### Comparison with Other Flows:

| Flow | `sub` Claim | Reason |
|------|-------------|--------|
| **Client Credentials** | `client_id` | Client acts on its own behalf, no user |
| **Authorization Code** | User identity ID (from Kratos) | User authorizes the client |
| **Device Authorization** | User identity ID (from Kratos) | User authorizes the device |
| **Refresh Token** | Same as original token | Inherits from the original grant |

## Ory Hydra Behavior:

Ory Hydra, by default, sets the `sub` claim to the `client_id` in Client Credentials flow tokens. This is the correct and expected behavior according to the OAuth 2.0 specification.

## If Your API Requires User Identity:

If your API endpoint requires a user identity ID in the `sub` claim, you have a few options:

1. **Use Authorization Code Flow instead** - This flow includes the user's identity in the `sub` claim
2. **Configure Hydra to map client to user** - Some implementations allow mapping a client to a service account user
3. **Use a different claim** - Store the user/service account identity in a custom claim (e.g., `user_id`, `service_account_id`) instead of `sub`
4. **API should accept client_id as sub** - The API should be updated to accept `client_id` as the `sub` for Client Credentials flow tokens

## Verification:

You can verify the `sub` claim in your tokens by:
1. Using the Client Credentials demo page - it shows token information including `sub`
2. Decoding the JWT token manually
3. Checking server logs when testing the API

## References:

- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749#section-4.4)
- [RFC 7523 - JSON Web Token (JWT) Profile for OAuth 2.0 Client Authentication and Authorization Grants](https://tools.ietf.org/html/rfc7523)
- [Ory Hydra Documentation](https://www.ory.sh/docs/hydra/)

