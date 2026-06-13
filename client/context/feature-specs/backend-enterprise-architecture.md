# Backend Enterprise Architecture Feature Spec

## Purpose

Use this spec whenever implementing the backend folder-structure reengineering. The goal is to turn the backend into a scalable NestJS architecture with explicit domain, application, infrastructure, interface, module, and shared boundaries.

This spec is backend-only. Do not modify frontend code for this architecture pass unless a backend type contract forces a generated update.

## Current State

The backend currently works through a mixture of technical folders:

- `jobs/`: queue processors, sync strategies, strategy registries, outcomes, and platform-specific workflow logic.
- `connectors/`: provider services, credential helpers, retry/rate-limit utilities, OAuth helpers, generated-adjacent code, and factory/registry behavior.
- `api/webhooks/`: webhook controllers, guards, processors, services, event persistence, and queue dispatch.
- `supabase/`: concrete persistence implementation and generated types.
- `common/`: mixed cross-cutting helpers, mappers, guards, and utilities.
- `tasks/`: scheduled sync enqueueing.

The structure makes boundaries unclear. It also encourages direct imports, circular module pressure, manual service construction, and feature logic spread across unrelated folders.

## Target State

The backend should move toward this architecture:

```text
backend/src/
  bootstrap/
  shared/
  domain/
  application/
  infrastructure/
  interfaces/
  modules/
```

### `bootstrap`

Runtime startup concerns:

- configuration loading
- logging initialization
- observability/New Relic setup
- process/runtime bootstrap helpers

### `shared`

Cross-cutting reusable code that is not business-domain-specific:

- auth helpers and base guards
- crypto helpers
- error primitives
- logging helpers
- validation helpers
- generic utilities

### `domain`

Pure business layer:

- store, credential, product, order, return, inventory, fulfillment, metric, alert, webhook, sync, and connector concepts
- domain events
- domain policies
- repository/connector ports where they represent business contracts

Domain code must be framework-free.

### `application`

Use cases and orchestration:

- sync scheduling and orchestration
- products/orders/returns sync strategy contracts and workflows
- webhook ingestion/routing use cases
- connector registry contracts
- credential validation use cases
- retry and rate-limit policies

Application code may depend on domain contracts and injected ports. It should not depend directly on Supabase, BullMQ decorators, controllers, or provider SDK clients.

### `infrastructure`

Concrete implementations:

- Supabase repositories and generated DB type wrappers
- BullMQ processors, producers, queue config, and queue-specific job serialization
- external provider adapters for Amazon, Faire, Shopify, Target, TikTok, Walmart, and Warehance
- generated SDK wrappers
- provider HTTP clients

Infrastructure implements domain/application ports.

### `interfaces`

Inbound API surfaces:

- HTTP controllers
- webhook controllers
- guards
- DTOs
- request validation
- response shaping

Interfaces call application services and use cases only.

### `modules`

NestJS composition:

- `shared.module.ts`
- `persistence.module.ts`
- `connectors.module.ts`
- `sync.module.ts`
- `webhooks.module.ts`

Modules should wire providers together. They should not contain business logic.

## Required Boundaries

- Domain must not import NestJS, BullMQ, Supabase, provider SDKs, generated SDK clients, or infrastructure classes.
- Application must not import HTTP controllers, webhook controllers, Supabase repositories, BullMQ processors, or concrete provider adapters.
- Infrastructure may import external SDKs and generated clients, but must expose narrow contracts.
- Interfaces must not import concrete repositories or provider adapters.
- Modules may import providers and Nest modules, but business behavior belongs elsewhere.

## Required Ports And Contracts

Create or preserve contracts for:

- `StoreRepositoryPort`
- `CredentialRepositoryPort`
- `ProductRepositoryPort`
- `OrderRepositoryPort`
- `ReturnRepositoryPort`
- `MetricsRepositoryPort`
- `AlertRepositoryPort`
- `WebhookEventRepositoryPort`
- `ConnectorRegistryPort`
- `ConnectorCredentialResolver`
- `SyncJobProducer`
- `WebhookEventProducer`
- `ProductsSyncStrategy`
- `OrdersSyncStrategy`
- `ReturnsSyncStrategy`

Exact names may follow existing conventions, but each dependency direction must remain clear.

## Provider Adapter Rules

Each provider adapter should own provider-specific details:

- authentication payload shape
- API client construction
- pagination
- rate-limit handling
- provider-specific retry classification
- provider response mapping
- webhook signature verification when provider-specific

Shared sync orchestration should not branch deeply on provider internals.

## Queue Rules

- Queue payloads should contain identifiers and metadata, not raw credentials.
- Processors should be thin.
- Processors load context, call application use cases, and record outcomes.
- Idempotent job IDs should be preserved or added where missing.
- BullMQ-specific code belongs under `infrastructure/queues/bullmq`.

## Webhook Rules

- Webhook controllers should validate, persist, enqueue, and acknowledge quickly.
- Provider-specific webhook normalization should be isolated.
- Durable processing should happen through application use cases and queue workers.
- Synchronous provider event processing should not live inside controllers.

## Protected Areas

Do not manually edit:

- `backend/.api/`
- `backend/src/libs/tiktok/`
- `backend/src/connectors/shopify/graphql/generated/`
- `frontend/types/supabase.types.ts`

When generated code is needed, wrap it from infrastructure instead of importing it across the application layer.

## Implementation Prompt

When asked to implement the backend enterprise structure plan:

1. Start with one migration unit from `client/plans/007-backend-enterprise-structure.md`.
2. Preserve behavior, queue names, route paths, table names, platform IDs, and environment variable names.
3. Move files incrementally and use compatibility exports only while necessary.
4. Prefer dependency inversion over direct imports across layers.
5. Keep generated/protected files untouched.
6. Run backend build/tests after each slice.
7. Refresh Graphify after code changes.

## Acceptance Criteria

- Backend source structure clearly separates domain, application, infrastructure, interfaces, modules, bootstrap, and shared concerns.
- Existing sync, connector, webhook, and persistence behavior remains compatible.
- Manual connector construction is removed from runtime factories.
- Queue processors are thin and infrastructure-owned.
- Application sync and webhook use cases are testable without BullMQ, HTTP controllers, or Supabase clients.
- Backend build passes.
- Relevant backend tests pass.
- Graphify is updated after implementation.
