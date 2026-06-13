# Architecture Context

## Current Stack

- Backend: NestJS, TypeScript, BullMQ, Redis, Supabase, `nestjs-pino`, scheduled tasks, marketplace connectors, webhook modules.
- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS v4, shadcn/new-york components, Radix UI, TanStack Query/Table, Zustand, Supabase generated types.
- Data: Supabase tables for stores, credentials, products, inventory, orders, order items, fulfillments, returns, alerts, metrics, and raw events.
- Graph/context: Graphify output exists in `graphify-out/` and should be used for architecture orientation.

## Backend Shape

- `AppModule` wires config, Supabase, common services, connectors, webhooks, BullMQ, jobs, scheduler, and logging.
- `TasksService` polls active stores and queues product/order/return jobs.
- `JobsModule` registers `products`, `orders`, and `returns` queues and owns current processors.
- Job processors currently contain platform branching, service creation, mapping, persistence, metrics, health updates, and errors in large files.
- `PlatformServiceFactory` currently constructs connector services manually and passes loosely typed credentials.
- `api/webhooks` currently verifies some signatures, but processing is not consistently durable or async.

## Frontend Shape

- `frontend/app` owns routes and layout groups.
- `frontend/modules` owns product-facing domains: auth, dashboard, integrations, events, notifications, settings, team.
- `frontend/components` owns shared layout and UI primitives.
- `frontend/types/supabase.types.ts` is generated and should be treated as schema reference.

## Target Reengineering Direction

- Keep current product behavior while improving internal boundaries.
- Move sync orchestration toward small queue processors plus per-platform/per-domain strategies.
- Keep job payloads small and fetch/decrypt credentials in workers.
- Make webhooks verify, persist, enqueue, and acknowledge quickly.
- Centralize retry, rate-limit, cursor, and credential validation policies.
- Keep frontend dense, operational, and module-oriented while reducing raw database-shape coupling in screens.

## Invariants

- Existing public routes, queue names, Supabase tables, and UI flows stay compatible during early reengineering.
- Generated SDK/API/type files are not architecture guidance.
- Credentials and tokens must not be logged.
- Sync jobs must be idempotent and safe to retry.
