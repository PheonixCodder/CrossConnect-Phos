# Feature Spec: Events

## Current State

Events UI shows event rows and payload viewer behavior. Backend raw event persistence exists, but webhook processing is not fully durable yet. Event payloads may include provider data that should be treated as sensitive until redaction rules are explicit.

## Target State

Events should become the operator-facing audit trail for webhook and sync activity. It should show useful debugging context without exposing secrets.

## Requirements

- Preserve current events route.
- Keep payload viewer for debugging.
- Align displayed fields with raw event and sync event storage.
- Redact secret-bearing payload fields once backend redaction is implemented.
- Distinguish received, ignored, queued, processed, failed, and duplicate events when backend supports those states.

## Acceptance Criteria

- Events screen remains useful for debugging provider activity.
- Sensitive payload fields are redacted or excluded.
- Event status labels match durable webhook processing states.

## Verification

- `cd frontend && npm run lint`
- `cd frontend && npm run build`
