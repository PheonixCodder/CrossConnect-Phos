# Plan 002: Connector Boundaries

## Summary

Standardize platform connector behavior after sync engine orchestration is separated. This unit targets `PlatformServiceFactory`, platform strategy classes, typed credentials, rate profiles, and shared retry/backoff behavior.

## Key Changes

- Define connector capability metadata for Amazon, Walmart, Shopify, TikTok, Faire, Target, and Warehance.
- Add domain strategy interfaces for products, orders, and returns; implement adapters per supported platform/domain.
- Move broad platform branching out of job processors into strategy selection.
- Replace ad hoc `any` credential assumptions with per-platform credential validators.
- Centralize retry, backoff, pagination, and rate-limit helpers.
- Migrate away from manual `new` construction in `PlatformServiceFactory` toward injectable adapters/factories.

## Test Plan

- Unit test capability profiles for supported domains and platform limitations.
- Unit test strategy dispatch with mocked strategies.
- Unit test credential validation before connector initialization.
- Unit test retry/rate-limit utility behavior.
- Run `cd backend && npm run test`.
- Run `cd backend && npm run build`.

## Assumptions

- Provider-specific service methods can remain internally platform-specific.
- Current external provider API behavior is preserved.
- Full queue concurrency/rate-limit tuning happens only after capability profiles are in place.
