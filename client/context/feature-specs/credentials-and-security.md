# Feature Spec: Credentials And Security

## Current State

Credential encryption exists through `CryptoService`, but runtime env validation only covers Supabase URL/key. Scheduled jobs currently include credentials in Redis payloads until Unit 002 removes them. OAuth and connector files contain `console.log` calls that can expose tokens or raw provider data. `common/guards/auth.guard.ts` returns the full authorization header instead of explicitly parsing a Bearer token.

## Target State

Credentials should be typed, validated, encrypted/decrypted consistently, never logged, and never serialized into Redis job payloads. Runtime configuration should fail fast when required secrets or infrastructure settings are missing. Authentication guards should parse tokens explicitly.

## Required Interfaces

- Per-platform credential schema for Amazon, Walmart, Shopify, TikTok, Faire, Target, and Warehance.
- `redactSecretFields(value)` utility or equivalent logging policy for provider payloads.
- Explicit Bearer token extraction in the auth guard.

## Requirements

- Add credential schemas without changing stored credential shape unless a migration is approved.
- Validate required environment variables at boot, including Redis, Supabase, encryption key, app/frontend URLs, and platform OAuth/app secrets where features require them.
- Remove token/credential `console.log` calls.
- Keep encryption key validation strict.
- Fetch credentials inside workers by store ID.
- Reject invalid credentials before partial sync work begins.
- Parse `Authorization: Bearer <token>` explicitly.

## Acceptance Criteria

- No access token, refresh token, credential object, HMAC secret, or encrypted payload internals are logged.
- Jobs run with store IDs and fetch credentials at execution time.
- Missing critical env vars fail clearly at startup.
- Invalid credential payloads produce actionable errors and health/alert state.
- Auth guard behavior is unambiguous and tested.

## Verification

- `cd backend && npm run test`
- `cd backend && npm run build`
- Add env validation tests.
- Add credential schema success/failure tests.
- Add auth guard Bearer parsing tests.
- Add a search check for unsafe `console.log` token/credential logging.
