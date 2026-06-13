# Code Standards

## General

- Keep implementation changes scoped to the active feature-spec and plan.
- Prefer explicit types over `any`, especially for credentials, connector responses, job payloads, and webhook events.
- Preserve existing behavior during reengineering unless the active plan explicitly approves a migration.
- Keep generated files out of architecture decisions.
- Do not log credentials, access tokens, refresh tokens, signatures, raw secrets, or encrypted payload internals.

## Backend

- Queue processors should orchestrate; platform-specific sync logic belongs in strategies/services.
- Job payloads should contain identifiers and sync metadata, not full credentials.
- Sync work must be idempotent and safe under retries.
- Use batch upserts and stable external IDs for persistence.
- Centralize retry, backoff, and rate-limit behavior instead of duplicating sleeps and loops across connectors.
- Use Nest dependency injection where possible; avoid manual `new` for injectable services unless a plan documents why.
- Environment validation must include required runtime dependencies, not only Supabase keys.

## Frontend

- Keep feature code inside `frontend/modules/<domain>`.
- Use shared primitives from `frontend/components/ui` and shared layout components.
- Use domain hooks and derived view models for screens.
- Treat `frontend/types/supabase.types.ts` as generated schema reference, not a UI model layer.
- Keep app UI dense and operational.

## Protected or Generated Areas

Do not edit these unless the active plan is specifically about regeneration or vendor integration:

- `backend/.api/`
- `frontend/.api/`
- `backend/src/libs/tiktok/`
- `backend/src/connectors/shopify/graphql/generated/`
- `frontend/types/supabase.types.ts`
- `frontend/next-env.d.ts`
- `frontend/tsconfig.tsbuildinfo`
- `graphify-out/`

## Verification Commands

- Backend tests: `cd backend && npm run test`
- Backend build: `cd backend && npm run build`
- Backend lint may rewrite files: use only when explicitly intended.
- Frontend lint: `cd frontend && npm run lint`
- Frontend build: `cd frontend && npm run build`
- Graph refresh after code changes: `graphify update .`
