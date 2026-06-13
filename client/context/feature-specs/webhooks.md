# Feature Spec: Webhooks

## Current State

Webhook controllers exist for Shopify, Walmart, and TikTok. Some guards/signature checks exist, but processors mostly call `process` directly from `enqueue`, so they are not durable queues. Shopify has many empty event cases, and Walmart processing is still placeholder-level. TikTok performs more direct persistence but still processes in the request path.

## Target State

Webhook endpoints should verify signatures, persist raw events, enqueue durable work, and acknowledge quickly. Processing should be idempotent by provider event ID and should route domain changes through the same sync/update policies as scheduled work when possible.

## Required Interfaces

- `WebhookIngestPayload`: provider, storeId, userId if available, eventId, topic/type, receivedAt, rawBody hash, payload.
- `WebhookJobPayload`: rawEventId, provider, storeId, eventId, topic/type, reason: `webhook`.
- `WebhookEventIdPolicy`: provider-specific event ID/header/body extraction.

## Requirements

- Preserve current webhook route compatibility.
- Validate signatures before accepting events.
- Persist raw events before enqueueing processing.
- Enqueue durable webhook jobs instead of doing heavy processing inline.
- Handle duplicate event IDs safely.
- Document provider-specific event routing for Shopify, Walmart, and TikTok.
- Unknown events should be stored and logged without crashing ingestion.

## Acceptance Criteria

- Controllers acknowledge valid events quickly after persistence/enqueue.
- Duplicate webhook delivery does not duplicate downstream writes.
- Shopify and Walmart no longer have fake enqueue methods that call direct processing only.
- Empty Shopify event cases are explicitly classified as ignored, unsupported, or routed.
- Webhook event payloads do not expose secrets in logs or frontend event views.

## Verification

- `cd backend && npm run test`
- `cd backend && npm run build`
- Add controller tests for valid, invalid, duplicate, and unknown events.
- Add provider event ID extraction tests.
- Add processor tests proving jobs are enqueued and processed asynchronously.
