# Feature Spec: Notifications

## Current State

Notifications display alerts and alert details. Backend creates alerts from sync failures, health failures, and selected webhook states, but duplicate alert behavior can become noisy during repeated retries.

## Target State

Notifications should consistently reflect actionable sync, credential, webhook, and platform health problems. Alerts should be deduplicated or grouped enough that repeated retries do not flood operators.

## Requirements

- Preserve current notifications route and alert table.
- Normalize backend alert types and severities over time.
- Avoid duplicate alert floods from repeated job retries.
- Connect alerts to store, platform, entity type, and entity ID where possible.
- Show enough context for an operator to understand what failed and what action is needed.

## Acceptance Criteria

- Operators can understand what failed, where, and what changed.
- Repeated failures do not create unbounded noisy alerts.
- Alert severities are consistent across sync, webhook, and credential failures.

## Verification

- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- Backend alert behavior tests in relevant reengineering units.
