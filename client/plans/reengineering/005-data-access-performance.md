# Plan 005: Data Access Performance

## Summary

Improve Supabase access patterns and CPU-heavy mapping paths after sync boundaries are cleaner. This unit targets batching, idempotent upserts, cursor consistency, and metrics derivation.

## Key Changes

- Make repository methods explicit about conflict keys and batch behavior.
- Prefer batched lookup methods over full-store reads where processors need ID maps.
- Optimize `deriveMetricsFromOrders` by pre-indexing order items and fulfillments by `order_id`.
- Route cursor updates through one consistent repository/service path.
- Document recommended indexes before any schema migration.

## Test Plan

- Unit test metrics derivation with multiple orders, items, fulfillments, empty arrays, and mixed statuses.
- Unit test repository payload construction and dedup behavior.
- Unit test cursor update path for products, orders, and returns.
- Run `cd backend && npm run test`.
- Run `cd backend && npm run build`.

## Assumptions

- Supabase schema remains unchanged until an index/migration plan is approved.
- Sync strategy work from earlier units makes repository call sites easier to update safely.
