# Plan 003: Webhook Ingestion

## Summary

Make webhook handling durable, idempotent, and fast to acknowledge. Replace fake enqueue/direct processing with a verify-persist-enqueue-ack flow.

## Key Changes

- Keep current Shopify, Walmart, and TikTok webhook routes.
- Verify signatures before persistence.
- Persist raw event payloads with provider, event ID, store ID, topic/type, received timestamp, and payload hash.
- Add webhook queue/job payloads that reference raw event IDs.
- Make duplicate handling provider-specific and idempotent.
- Classify each current Shopify/Walmart event branch as processed, ignored, unsupported, or future.
- Keep heavy domain updates out of request handlers.

## Test Plan

- Test valid and invalid signatures.
- Test duplicate event handling.
- Test unknown events are persisted and acknowledged safely.
- Test controller returns ACK after persistence/enqueue.
- Test processors consume queued jobs instead of inline processing.
- Run `cd backend && npm run test`.
- Run `cd backend && npm run build`.

## Assumptions

- Existing raw events storage remains available.
- Provider event IDs are available through headers/body or can be derived with payload hash fallback.
