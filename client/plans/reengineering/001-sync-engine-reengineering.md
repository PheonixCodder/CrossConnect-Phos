# Plan 001: Sync Engine Reengineering

## Summary

Refactor the backend sync engine in a compatibility-preserving pass. This unit removes credentials from scheduled job payloads, adds deterministic job IDs, introduces shared sync payload/outcome types, and reduces duplicated processor preflight/outcome logic. It does not rewrite every platform mapping path yet.

## Implementation Changes

- Add a shared sync module under `backend/src/jobs/`:
  - `sync.types.ts` for `SyncDomain`, `SyncJobReason`, `SyncJobPayload`, `SyncContext`, and `SyncResult`.
  - `sync-job.util.ts` for domain cursor selection and deterministic job ID creation.
  - `sync-outcome.service.ts` for success/failure cursor, health, and alert updates.
- Update `TasksService`:
  - Stop reading credentials during polling except to confirm active stores have credentials.
  - Queue payloads with `storeId`, `platform`, `orgId`, `domain`, `since`, `enqueuedAt`, and `reason: 'scheduled'`.
  - Use `last_products_synced_at`, `last_orders_synced_at`, and `last_returns_synced_at` as domain cursors.
  - Use job IDs `sync:<domain>:<storeId>:<cursorKey>`.
  - Keep queue names and job names unchanged.
- Update products/orders/returns processors:
  - Type `job.data` as `SyncJobPayload`.
  - Use shared preflight: validate payload, fetch store, fetch credentials, create platform service.
  - Use `SyncOutcomeService` for success and failure handling.
  - Keep existing platform-specific private processing methods in place for this unit.
- Update `JobsModule` providers/exports for the new shared sync services.

## Compatibility Rules

- Do not rename queues.
- Do not change Supabase schema.
- Do not change dashboard/frontend behavior.
- Do not modify generated/vendor files.
- Do not rewrite connector contracts in this unit; that is Plan 002.
- Existing `PlatformServiceFactory` can remain for this unit, but its usage should be isolated behind shared preflight logic.

## Test Cases

- `TasksService` queues products/orders/returns payloads without credentials.
- `TasksService` uses the correct domain cursor for each job.
- `TasksService` skips unsupported returns platforms using current behavior.
- Job ID helper returns stable IDs for the same store/domain/cursor.
- Processor preflight fetches store and credentials by `storeId`.
- Success outcome marks store healthy and updates the correct domain cursor.
- Failure outcome marks store unhealthy and creates the correct domain alert.

## Verification

- Run `cd backend && npm run test`.
- Run `cd backend && npm run build`.
- Do not run `npm run lint` unless formatting rewrites are explicitly desired.

## Assumptions

- Existing processor private platform methods remain the source of platform behavior during this unit.
- `store_credentials` records are still required for scheduled sync eligibility.
- `last_synced_at` may continue to be updated for compatibility only, but domain cursor fields are authoritative for sync windows.
