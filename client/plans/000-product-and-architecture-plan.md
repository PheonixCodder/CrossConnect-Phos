# Product And Architecture Plan

## Product

CrossConnect-Phos is a multi-channel commerce operations dashboard for stores connected across Amazon, Walmart, Shopify, TikTok, Faire, Target, and Warehance. The app should help operators connect stores, sync data, monitor health, inspect events, and act on inventory/order/return/alert information.

## Architecture Direction

- Preserve current app behavior while reengineering internals.
- Backend reliability and performance are the first priority.
- Refactor the sync layer toward small processors, typed job payloads, platform/domain strategies, and durable persistence.
- Refactor connectors toward explicit contracts, typed credentials, centralized retry/rate-limit policy, and consistent cursor handling.
- Refactor webhooks toward fast acknowledge plus durable async processing.
- Frontend cleanup comes after backend foundations and should preserve the current dashboard design.

## Constraints

- Keep current queues, routes, tables, and UI behavior compatible in early phases.
- Do not edit generated/vendor artifacts unless explicitly regenerating.
- Do not leak credentials/tokens in logs or job payloads.
- Prefer focused tests and build gates over giant rewrites.

## Verification

- Backend: `npm run test`, `npm run build`.
- Frontend: `npm run lint`, `npm run build`.
- Context: every feature has a feature-spec and an ordered reengineering plan before implementation.
