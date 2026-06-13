# Backend Enterprise Structure Plan

## Summary

The backend has improved behaviorally, but the folder structure still reflects refactor history more than the product domain. The next backend-only architecture pass should move the codebase from technical buckets like `jobs`, `connectors`, `api`, `common`, `tasks`, and `supabase` into clear enterprise boundaries:

- `domain`: pure business models, policies, events, and ports.
- `application`: use cases, orchestration, sync workflows, webhook routing, and connector contracts.
- `infrastructure`: BullMQ, Supabase, external provider adapters, SDKs, generated clients, and runtime integrations.
- `interfaces`: HTTP controllers, webhook controllers, guards, DTOs, and request/response contracts.
- `modules`: NestJS composition modules only.
- `shared`: cross-cutting utilities that are not domain-specific.

This is a planned restructuring. It should be implemented incrementally with compatibility exports and tests after each slice.

## Current Problems

- `backend/src/jobs` mixes queue processors, sync orchestration, strategy registration, platform strategy implementations, persistence calls, and operational outcome handling.
- `backend/src/connectors` mixes provider adapters, credential parsing, retry/rate-limit helpers, OAuth helpers, generated-adjacent code, and registry/factory behavior.
- `backend/src/api/webhooks` mixes external HTTP concerns with durable event ingestion and queue dispatch.
- `backend/src/supabase` is a persistence implementation, but it currently sits as a first-class source boundary rather than under infrastructure.
- `backend/src/common` is too broad. It contains reusable helpers, mappers, auth/security utilities, and cross-cutting behavior without clear ownership.
- `JobsModule` and `ConnectorsModule` are overloaded and coupled. They should become small composition modules over explicit application and infrastructure services.
- `PlatformServiceFactory` still manually constructs connector services. Enterprise NestJS structure should use DI-backed provider registries and typed connector contracts.
- Protected/generated files are colocated with handwritten architecture concerns, making ownership harder to enforce.

## Target Structure

```text
backend/src/
  main.ts
  app.module.ts

  bootstrap/
    config/
    logging/
    observability/

  shared/
    auth/
    crypto/
    errors/
    logging/
    validation/
    utils/

  domain/
    stores/
    credentials/
    catalog/
    inventory/
    orders/
    returns/
    fulfillments/
    metrics/
    alerts/
    webhooks/
    sync/
    connectors/

  application/
    sync/
      scheduling/
      orchestration/
      outcomes/
      strategies/
        products/
        orders/
        returns/
    webhooks/
      ingestion/
      routing/
    connectors/
      registry/
      credentials/
      retry/
      rate-limits/

  infrastructure/
    persistence/
      supabase/
        repositories/
        types/
        migrations/
    queues/
      bullmq/
        processors/
        producers/
        queue-config/
    external/
      connectors/
        amazon/
        faire/
        shopify/
        target/
        tiktok/
        walmart/
        warehance/
      generated/
        tiktok/
        shopify-graphql/
        warehance-api/

  interfaces/
    http/
      controllers/
      guards/
      dto/
    webhooks/
      controllers/
      guards/
      dto/

  modules/
    shared.module.ts
    persistence.module.ts
    connectors.module.ts
    sync.module.ts
    webhooks.module.ts
```

## Boundary Rules

### Domain

- Must not import NestJS, BullMQ, Supabase, HTTP SDKs, provider SDKs, or generated clients.
- Owns business names and contracts: stores, credentials, orders, products, returns, sync windows, webhook events, connector capabilities.
- Exposes ports/interfaces for persistence and external effects.

### Application

- Owns use cases and orchestration.
- May depend on domain contracts and injected ports.
- Must not depend directly on concrete Supabase repositories, provider SDK clients, BullMQ decorators, or HTTP controllers.
- Sync strategies live here when they express business workflow. Provider-specific transport and API details live in infrastructure.

### Infrastructure

- Owns concrete implementations: Supabase repositories, BullMQ processors/producers, external connector adapters, generated SDK wrappers, retry transport clients, rate-limit adapters.
- May import external SDKs and generated code.
- Must implement application/domain ports instead of being called directly from controllers or use cases.

### Interfaces

- Owns inbound boundaries only: REST controllers, webhook controllers, guards, DTOs, request validation, response shaping.
- May call application services/use cases.
- Must not call Supabase repositories or provider adapters directly.

### Modules

- NestJS modules should compose dependencies only.
- Avoid business logic in modules.
- Avoid circular imports. If a cycle appears, introduce an explicit port or split a module.

### Protected Generated Code

These areas remain protected and should not be edited manually:

- `backend/.api/`
- `backend/src/libs/tiktok/`
- `backend/src/infrastructure/external/connectors/shopify/graphql/generated/`
- `frontend/types/supabase.types.ts`

Generated or SDK-owned backend code should be referenced through infrastructure wrappers, not imported broadly across the application layer.

## Migration Units

### Unit 1 - Shared And Bootstrap Boundaries

Create `bootstrap/` and `shared/` boundaries. Move app config, logger setup, auth guards/helpers, crypto, errors, validation, and neutral utilities out of `common/`.

Status: Completed 2026-06-11.

Acceptance:

- `common/` no longer acts as a catch-all.
- Shared utilities have clear folders and names.
- No business-specific services are placed in `shared/`.

Completed changes:

- Moved app config and env validation to `backend/src/bootstrap/config`.
- Extracted HTTP bootstrap setup from `main.ts` into `backend/src/bootstrap/http/app-bootstrap.ts`.
- Moved `CryptoService` into `backend/src/shared/crypto`.
- Replaced `CommonModule` with `SharedModule`.
- Moved `MyAuthGuard` into `backend/src/shared/auth/guards`.
- Moved the order metrics mapper into `backend/src/domain/metrics` and removed its dependency on generated Supabase types.
- Removed the old `backend/src/common` and `backend/src/config` file ownership.

### Unit 2 - Persistence Ports And Supabase Infrastructure

Move Supabase repositories and Supabase types under `infrastructure/persistence/supabase`. Add or formalize domain/application repository ports for stores, products, orders, returns, credentials, metrics, alerts, and webhook events.

Status: Completed 2026-06-12.

Acceptance:

- Application services depend on repository ports, not concrete Supabase classes. Started for scheduled tasks and sync outcome handling.
- Supabase-specific query details are isolated under infrastructure. Completed for concrete file ownership.
- Supabase generated types remain protected. Completed for the move; no generated type content was edited.

Completed changes:

- Moved `backend/src/supabase` to `backend/src/infrastructure/persistence/supabase`.
- Updated backend imports to the new persistence boundary.
- Preserved repository class names, provider registrations, table contracts, and runtime behavior.
- Kept repository specs colocated with the moved concrete repositories.
- Added domain repository ports and DI tokens for stores, store credentials, and alerts.
- Wired the store, credential, and alert repository tokens to existing Supabase implementations in `JobsModule`.
- Migrated `TasksService` and `SyncOutcomeService` to depend on repository ports instead of concrete Supabase repository classes.
- Moved sync success timestamp writes behind `StoresRepositoryPort.updateSyncTimestamps`, removing direct Supabase client usage from `SyncOutcomeService`.
- Added a webhook event repository port and DI token.
- Wired Shopify, Walmart, and TikTok webhook modules to provide the webhook event port from the concrete Supabase `EventsRepository`.
- Migrated Shopify, Walmart, and TikTok webhook processors to depend on `WebhookEventsRepositoryPort`.
- Added `ProductsRepositoryPort` and `InventoryRepositoryPort` with DI tokens `PRODUCTS_REPOSITORY` and `INVENTORY_REPOSITORY`.
- Wired product and inventory repository tokens to existing Supabase implementations in `JobsModule`.
- Made Supabase `ProductsRepository` and `InventoryRepository` implement the new ports.
- Migrated all seven product sync strategies to inject product/inventory repository ports instead of concrete Supabase classes.
- Extended `ProductsRepositoryPort` with `getAllProductsByStore` for Faire order product lookup.
- Added `OrdersRepositoryPort`, `OrderItemsRepositoryPort`, `FulfillmentsRepositoryPort`, `MetricsRepositoryPort`, and `ReturnsRepositoryPort` with DI tokens.
- Wired order, order-item, fulfillment, metric, and return repository tokens to existing Supabase implementations in `JobsModule`.
- Migrated all seven order sync strategies and all five return sync strategies to repository port injection, including store/alert ports where those strategies already depended on them.
- Replaced direct `StoresRepository.update` cursor writes in Amazon orders, Shopify returns, and Amazon products with `StoresRepositoryPort.updateSyncTimestamps`.
- Extended `StoresRepositoryPort` with `getOrgById` and `updateWebhookStatus` for Walmart webhook connect flow.
- Migrated products, orders, and returns queue processors to `STORES_REPOSITORY` and `STORE_CREDENTIALS_REPOSITORY`.
- Migrated all product sync strategies to `STORES_REPOSITORY` and `ALERTS_REPOSITORY` port injection.
- Migrated `PlatformServiceFactory`, `WarehanceService`, and `WalmartService` to repository port types.
- Migrated Walmart webhook controller and guard to store/credential repository ports.

Unit 2 note:

- Nest composition modules (`JobsModule`, webhook modules, connector modules) still register concrete Supabase repository classes and bind them to port tokens with `useExisting`. That is expected for this unit.

### Unit 3 - Connector Registry And Provider Adapters

Split connector concerns into:

- `application/connectors`: contracts, credentials, capability registry, rate-limit policy, retry policy.
- `infrastructure/external/connectors`: Amazon, Faire, Shopify, Target, TikTok, Walmart, Warehance adapters.

Replace manual `new` construction in `PlatformServiceFactory` with DI-backed provider registration.

Status: Completed 2026-06-12. Connector registry, DI factories, and folder restructure finished.

Acceptance:

- Adding a provider requires adding an adapter and registration, not editing sync processors.
- Credentials are typed per provider before use.
- Provider adapters expose consistent connector contracts.

Completed changes:

- Added `ConnectorServiceFactory` contract and `ConnectorRegistryService`.
- Added DI-backed per-platform connector factories for Amazon, Faire, Shopify, Target, TikTok, Walmart, and Warehance.
- Refactored `PlatformServiceFactory` into a thin registry facade that validates credentials and delegates creation.
- Registered connector factories in `JobsModule` and exported them through `ConnectorsModule`.
- Added focused registry tests for platform registration, delegation, and unsupported-platform errors.
- Moved connector contracts and policies to `backend/src/application/connectors` (types, capabilities, credentials, retry policy, platform factory, registry service).
- Moved per-platform connector factories to `backend/src/infrastructure/external/connectors/registry`.
- Moved provider service modules (Amazon, Faire, Shopify, Target, TikTok, Walmart, Warehance) and OAuth helpers to `backend/src/infrastructure/external/connectors/{platform}` and `backend/src/infrastructure/external/connectors/oauth`.
- Renamed the legacy `warehouse` adapter folder to `warehance` under infrastructure.
- Updated `JobsModule`, processors, sync strategies, webhook adapters, and GraphQL codegen output paths to the new infrastructure locations.
- Switched connector factories from manual `new Service(...)` construction to Nest `ModuleRef.create(...)` so provider dependencies resolve through DI before per-store `initialize(...)`.
- Added compatibility re-exports under `backend/src/connectors/` for application contracts, registry types, adapter factories, and platform Nest modules (removed 2026-06-12 once all imports migrated to `application/` and `infrastructure/` paths; `ConnectorsModule` now lives in `backend/src/modules/connectors.module.ts`).

Unit 3 note:

- Connector services remain stateful per sync job because each store has distinct credentials. `ModuleRef.create` gives a fresh Nest-managed instance per job while preserving existing initialize semantics.

Status: Completed 2026-06-12.

Acceptance:

- Queue processors only load job context, call application use cases, and record outcomes.
- Job payloads stay small and identifier-based.
- Strategy implementations no longer directly own BullMQ concerns.
- Products, orders, and returns sync flows share consistent orchestration patterns.

Completed changes:

- Moved sync types, job payload helpers, strategy registry, and all product/order/return strategies to `backend/src/application/sync`.
- Moved sync outcome handling to `backend/src/application/sync/outcomes`.
- Moved scheduled polling and queue enqueue logic to `backend/src/application/sync/scheduling/sync-scheduler.service.ts` (retains `TasksService` class name for now).
- Moved BullMQ processors to `backend/src/infrastructure/queues/bullmq/processors/` (`products.processor.ts`, `orders.processor.ts`, `returns.processor.ts`).
- Updated `JobsModule` to wire the new application and infrastructure paths; `jobs/` now contains only the composition module.

Status: Completed 2026-06-12.

Acceptance:

- Webhook controllers acknowledge requests quickly.
- Durable event persistence and queue enqueueing are explicit.
- Provider-specific webhook parsing is isolated behind adapters or mappers.

Completed changes:

- Moved webhook HTTP controllers and guards to `backend/src/interfaces/webhooks/`.
- Moved webhook event types, ingestion services, routing services, subscription handlers, and TikTok side-effect handling to `backend/src/application/webhooks/`.
- Moved BullMQ webhook processors to `backend/src/infrastructure/queues/bullmq/webhooks/`.
- Split processor responsibilities: ingestion persists and builds job payloads; processors enqueue; routers/handlers process worker jobs.
- Added composition modules under `backend/src/modules/webhooks/` and removed `backend/src/api/webhooks/`.

### Unit 6 - Module Cleanup And Compatibility Removal

Create small composition modules under `modules/`. During migration, keep compatibility barrel exports where needed. Remove old folders only after all imports are migrated.

Status: Completed 2026-06-13.

Acceptance:

- `AppModule` imports small feature/composition modules.
- No circular module relationship between sync/jobs and connectors.
- Old `jobs`, `tasks`, `api`, `connectors`, `supabase`, and `common` folders are either removed or contain only temporary compatibility exports.

Completed changes:

- Added `backend/src/modules/persistence.module.ts` for Supabase repository classes and repository port token bindings.
- Refactored `backend/src/modules/connectors.module.ts` to own platform modules, connector factories, registry, and `PlatformServiceFactory` without sync dependencies.
- Added `backend/src/modules/sync.module.ts` for BullMQ sync queues, processors, strategies, `SyncOutcomeService`, and `TasksService`; imports `ConnectorsModule` and `PersistenceModule`.
- Slimmed `backend/src/app.module.ts` to import `SyncModule` and `WebhooksModule` instead of `JobsModule`, `ConnectorsModule`, and direct `TasksService` registration.
- Removed legacy `backend/src/jobs/` and `backend/src/tasks/` folders.

## Import Rules

Use these rules as architecture checks during migration:

- `domain/**` cannot import from `@nestjs/*`, `bullmq`, `@supabase/*`, provider SDKs, or `infrastructure/**`.
- `application/**` cannot import from `interfaces/**` or concrete provider/Supabase implementation files.
- `interfaces/**` cannot import concrete repository classes or provider adapters.
- `infrastructure/**` can import external SDKs and generated code, but it should expose narrow application/domain contracts.
- `modules/**` can import Nest modules and providers, but should not contain business logic.

## Compatibility Strategy

- Move one vertical slice at a time.
- Use temporary `index.ts` or re-export files only to keep existing imports compiling during a slice.
- Do not rename queues, webhook routes, table names, provider platform IDs, or environment variables during the structure pass.
- Keep generated files untouched.
- Remove compatibility barrels once imports are fully migrated.

## Verification Plan

After each migration unit:

```bash
cd backend
npm run build
npm run test
```

Add static checks before removing compatibility layers:

- No forbidden imports from `domain`.
- No direct infrastructure imports from `interfaces`.
- No direct provider SDK imports from `application`.
- No remaining manual connector construction with `new`.
- No queue payloads containing raw credentials.

## Final Acceptance Criteria

- Backend structure matches the target architecture or documents intentional deviations.
- Sync, connector, webhook, persistence, and shared concerns have clear ownership.
- Nest modules are small composition boundaries.
- Existing behavior is preserved.
- Backend build and tests pass.
- Graphify is refreshed after implementation.
