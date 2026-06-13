# Plan 004: Credential Security

## Summary

Harden credential storage, validation, runtime environment validation, auth token parsing, and log safety.

## Key Changes

- Expand env validation for Supabase, Redis, encryption key, app URLs, frontend URL, and enabled platform secrets.
- Remove unsafe OAuth/connector `console.log` calls that may expose tokens or provider data.
- Add per-platform credential schemas without changing stored credential shape.
- Ensure sync workers fetch/decrypt credentials only at execution time.
- Add explicit Bearer token parsing in `common/guards/auth.guard.ts`.
- Add log redaction rules for credential-like fields.

## Test Plan

- Unit test env validation success and failure cases.
- Unit test credential schema validation for supported platforms.
- Unit test Bearer token parsing.
- Search for unsafe token/credential logging.
- Run `cd backend && npm run test`.
- Run `cd backend && npm run build`.

## Assumptions

- Existing encrypted credential records remain valid.
- No credential table migration is included in this unit.
- Unit 002 has already removed credentials from scheduled job payloads.
