# Feature Spec: Connectors

## Current State

Connectors vary by platform and expose platform-specific methods directly to jobs. `PlatformServiceFactory` manually constructs services with `new`, accepts `any` credentials, and initializes each platform inconsistently. Retry, sleep, pagination, cursor, and rate-limit behavior are duplicated across Amazon, Walmart, TikTok, Faire, Target, Shopify, and Warehance.

## Target State

Connectors should expose explicit capabilities and typed contracts. Sync processors should dispatch through product/order/return strategies instead of knowing platform details. Provider-specific services can remain, but their public surface must be normalized behind adapter/strategy classes.

## Required Interfaces

- `PlatformCapabilityProfile`: platform, supported sync domains, OAuth support, webhook support, cursor behavior, rate-limit profile.
- `ConnectorCredentialSchema`: per-platform validator for stored credential payloads.
- `ConnectorRetryPolicy`: retry count, backoff base, jitter, rate-limit status detection.
- `ProductsSyncStrategy`, `OrdersSyncStrategy`, `ReturnsSyncStrategy`: domain strategy interfaces with `supports(platform)` and `sync(context)` behavior.

## Requirements

- Replace broad job-level platform branching with strategy dispatch after Unit 002.
- Keep existing provider service methods during migration, but isolate them behind strategies.
- Move retry/backoff/pagination helpers into shared connector utilities.
- Define per-platform rate profiles before changing queue concurrency.
- Keep generated SDK/type files protected.
- Preserve current external API behavior during migration.

## Acceptance Criteria

- Jobs do not need platform-specific switch statements for normal sync flow.
- `PlatformServiceFactory` no longer manually constructs every connector with ad hoc `new` in final target state.
- Credential validation happens before connector initialization.
- Retry/backoff/rate-limit behavior is consistent and testable.
- Adding a platform requires adding capability metadata and strategy implementations, not editing monolithic processors.

## Verification

- `cd backend && npm run test`
- `cd backend && npm run build`
- Add contract tests using mocked connector strategies.
- Add credential schema tests for each supported platform.
- Add retry/rate-limit utility tests for rate-limit and non-rate-limit errors.
