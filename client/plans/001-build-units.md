# Build Units

## Unit 001 - Context Scaffold

- Goal: Create authoritative context, feature-specs, and reengineering plans.
- Scope: `client/` scaffold, feature-specs, reengineering plans, and shortcomings traceability.
- Excluded: Backend/frontend implementation changes.
- Verification: Inspect all scaffold files for consistency and placeholder removal.
- Status: Complete.

## Unit 002 - Sync Engine Reengineering

- Goal: Make scheduled sync and BullMQ processing reliable, idempotent, and easier to extend.
- Scope: tasks, job payloads, processors, sync orchestration, store health updates.
- Excluded: Full connector rewrite and UI changes.
- Verification: backend unit tests plus build.
- Status: Complete.

## Unit 003 - Connector Boundaries

- Goal: Standardize per-platform service contracts, credential schemas, capabilities, retries, and rate limits.
- Scope: connector services, mappers, platform factory replacement path.
- Excluded: Marketplace feature expansion.
- Verification: connector contract tests and backend build.
- Status: In progress - foundation and product strategies complete; orders/returns extraction remains.

## Unit 004 - Durable Webhooks

- Goal: Verify, persist, enqueue, deduplicate, and acknowledge webhook events quickly.
- Scope: Shopify, Walmart, TikTok webhook modules and raw event processing.
- Excluded: New webhook providers.
- Verification: webhook controller/processor tests and backend build.
- Status: Not started.

## Unit 005 - Credentials And Security

- Goal: Harden env validation, credential typing, encryption usage, Bearer token parsing, and log safety.
- Scope: credential schemas, encrypted payload handling, OAuth logs, env validation, auth guard behavior.
- Excluded: Auth provider replacement.
- Verification: security-focused unit tests and backend build.
- Status: Not started.

## Unit 006 - Data Access Performance

- Goal: Improve batching, idempotent upserts, cursor updates, and metrics calculation.
- Scope: Supabase repositories, common metric derivation, cursor update path, and index recommendations.
- Excluded: Database schema migration unless separately approved.
- Verification: repository/mapper unit tests and backend build.
- Status: Not started.

## Unit 007 - Frontend Domain Cleanup

- Goal: Keep the current dashboard UI while improving feature boundaries and view models.
- Scope: dashboard, integrations, events, notifications, settings, team modules, and generated type boundary.
- Excluded: Visual redesign.
- Verification: frontend lint/build and focused hook/component tests when added.
- Status: Not started.
