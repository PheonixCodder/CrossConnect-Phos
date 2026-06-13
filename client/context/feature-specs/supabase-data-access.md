# Feature Spec: Supabase Data Access

## Current State

Repositories encapsulate Supabase access, but processors still perform multi-step data workflows directly. Some sync paths fetch broad product/order sets to build maps. `deriveMetricsFromOrders` scans orders, order items, and fulfillments with nested loops, which is acceptable for small data but inefficient as volume grows.

## Target State

Repositories should provide efficient batch operations, stable idempotent upserts, cursor updates, and minimal round trips. Metrics and mapping logic should scale linearly where possible. Schema/index changes must be documented before migration.

## Required Interfaces

- Batch lookup methods by store plus external IDs/SKUs.
- Repository methods that name conflict keys in comments or method names.
- `deriveMetricsFromOrders` implementation that pre-indexes `orderItems` and `fulfillments` by `order_id`.

## Requirements

- Preserve current table names and generated types.
- Use external IDs and store IDs as stable upsert boundaries.
- Prefer batched lookups over full-store reads.
- Optimize metrics derivation with maps keyed by `order_id`.
- Update domain cursor fields consistently after successful sync.
- Document needed indexes before proposing schema changes.

## Acceptance Criteria

- Sync paths avoid unnecessary repeated database queries.
- Metrics derivation is linear over orders/items/fulfillments.
- Repository method names describe behavior and conflict keys.
- Cursor updates happen through a consistent path.
- No schema migration is made without a dedicated migration/index plan.

## Verification

- `cd backend && npm run test`
- `cd backend && npm run build`
- Add unit tests for metrics derivation with multiple orders/items/fulfillments.
- Add repository payload construction/dedup tests.
- Add index recommendation notes before schema migration work.
