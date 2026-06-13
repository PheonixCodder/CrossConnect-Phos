# Feature Spec: Sync Engine

## Current State

`TasksService` polls active stores every 7 hours and on module init, then queues products, orders, and returns jobs. It currently loads credentials while polling and still places credentials in job payloads, even though processors already fetch credentials again by `storeId`.

The three queue processors fetch store and credentials, create a platform service, switch by platform, perform connector calls, map responses, persist Supabase rows, update cursors, update health, and create alerts. The files are large and duplicate failure/health handling across domains and platforms.

Current queues are `products`, `orders`, and `returns`. Current cursor fields on `stores` are `last_products_synced_at`, `last_orders_synced_at`, `last_returns_synced_at`, and generic `last_synced_at`.

## Target State

The sync engine should become a small orchestration layer around typed payloads and domain/platform strategies. Queue payloads should contain sync metadata only. Workers should load store and credentials by ID at execution time, dispatch to a strategy, update domain cursor fields on success, and report failures through one shared outcome path.

## Required Interfaces

Create a shared sync type module under backend sync/jobs code with these concepts:

- `SyncDomain = 'products' | 'orders' | 'returns'`
- `SyncJobPayload`:
  - `storeId: string`
  - `platform: Database['public']['Enums']['platform_types']`
  - `orgId: string`
  - `domain: SyncDomain`
  - `since?: string`
  - `enqueuedAt: string`
  - `reason: 'scheduled' | 'manual' | 'webhook'`
- Job names stay `${platform}.${domain}`.
- Job IDs use `sync:${domain}:${storeId}:${cursorKey}` where `cursorKey` is the ISO `since` value or `initial` when no cursor exists.

## Requirements

- Preserve queue names: `products`, `orders`, `returns`.
- Preserve current public routes, Supabase tables, and frontend data behavior.
- Remove credentials from all scheduled job payloads.
- Continue fetching credentials in workers by `storeId`.
- Use domain cursor fields for `since`; do not rely on generic `last_synced_at` for all domains.
- Keep returns support limited to platforms currently processed by the returns processor unless a later connector plan expands it.
- Centralize success/failure health updates and alert creation for products/orders/returns.
- Keep platform-specific connector and mapper behavior unchanged during the first sync-engine refactor.

## Acceptance Criteria

- Scheduled job payloads no longer contain credentials.
- Job IDs are deterministic for store/domain/cursor and reduce duplicate queued work.
- Products/orders/returns processors delegate shared preflight and outcome behavior instead of duplicating it.
- Existing platform sync behavior remains compatible.
- Failed store syncs produce a clear unhealthy state and alert.
- Successful syncs update the correct domain cursor field.

## Verification

- Add `backend/src/tasks/tasks.service.spec.ts` for payload and job ID behavior.
- Add focused processor/orchestrator tests under `backend/src/jobs/**/*.spec.ts`.
- Run `cd backend && npm run test`.
- Run `cd backend && npm run build`.
