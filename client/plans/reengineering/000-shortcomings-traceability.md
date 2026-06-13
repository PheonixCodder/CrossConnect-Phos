# Reengineering Shortcomings Traceability

## Purpose

This checklist maps the original architecture/performance findings to the primary plan that owns the fix. Related plans may reference the same issue, but each issue has one primary owner.

## Findings To Plan Mapping

| Finding | Primary plan | Coverage |
|---|---|---|
| Job processors are monoliths mixing queue handling, platform branching, fetching, mapping, persistence, metrics, health, and errors. | `001-sync-engine-reengineering.md` | Shared payloads, preflight, outcomes, and strategy direction. |
| `TasksService` queues stores sequentially, uses fixed delay, and places credentials in jobs. | `001-sync-engine-reengineering.md` | Metadata-only payloads, deterministic IDs, cursor-aware enqueueing. |
| `PlatformServiceFactory` manually constructs services with `new` and loose credentials. | `002-connector-boundaries.md` | Injectable adapters/factories, capability profiles, credential validators. |
| Webhook enqueue methods are not durable and often call processing directly. | `003-webhook-ingestion.md` | Verify, persist, enqueue, acknowledge flow. |
| Shopify/Walmart webhook processors contain placeholder or empty event cases. | `003-webhook-ingestion.md` | Provider event classification and durable processing tests. |
| OAuth/connector files contain token or provider-data logging. | `004-credential-security.md` | Unsafe log removal and redaction rules. |
| Credentials use broad `any` shapes. | `004-credential-security.md` | Per-platform credential schemas. |
| Retry/backoff/rate-limit logic is scattered. | `002-connector-boundaries.md` | Shared retry/rate-limit utilities and platform rate profiles. |
| `deriveMetricsFromOrders` does nested scans. | `005-data-access-performance.md` | Pre-index items/fulfillments by `order_id`. |
| Auth guard returns full authorization header instead of parsing Bearer token explicitly. | `004-credential-security.md` | Bearer parsing tests and implementation. |
| Frontend is at risk of coupling to raw generated Supabase table shapes. | `006-frontend-domain-cleanup.md` | Domain hooks/view models and presentational component boundaries. |

## Completion Rule

An issue is not complete until its primary plan has implementation, tests, verification commands passing, and progress/decision logs updated.
