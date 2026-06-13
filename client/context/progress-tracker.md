# Progress Tracker

## Current Phase

Backend Enterprise Structure Unit 6 is complete. Composition modules live under `backend/src/modules/` (`persistence`, `connectors`, `sync`, `webhooks`), and legacy `jobs/` and `tasks/` folders are removed.

## Completed

- Confirmed no previous `client/` context scaffold existed.
- Generated the default project context scaffold.
- Cleaned Graphify noise and rebuilt a focused code graph.
- Identified backend reengineering priorities: sync engine, connector boundaries, webhooks, credentials/security, data-access performance, frontend domain cleanup.
- Created authoritative context files, domain feature-specs, and ordered reengineering plans.
- Hardened all remaining feature-specs and plans so the original shortcomings map to concrete implementation units.
- Added `plans/reengineering/000-shortcomings-traceability.md`.
- Implemented Unit 002 backend sync engine reengineering.
- Implemented Unit 003 connector-boundary slices: capability profiles, credential preflight validation, shared retry policy helpers, product/order/return strategy dispatch registries, and all product/order/return sync strategies.
- Implemented Unit 004 webhook durability with Shopify, Walmart, and TikTok raw-event persistence plus durable queue dispatch.
- Started Unit 005 credential/log-safety cleanup by removing token/credential logs and raw `console.*` calls from active backend code outside protected generated SDK files.
- Started Unit 006 data-access performance cleanup by replacing nested order metric scans with indexed lookups.
- Continued Unit 006 data-access performance cleanup by batching external order ID repository lookups, removing redundant product SKU lookup batching, chunking return upserts, adding sync hot-path database indexes, replacing several full-catalog order product reads with scoped SKU lookups, and adding identifier-scoped product lookup for Amazon/Warehance orders.
- Continued Unit 007 dashboard table cleanup by adding product, inventory, order, and return table view models and adapting dashboard table components away from generated Supabase row props.
- Continued Unit 007 dashboard detail cleanup by moving product, order, and return dialog Supabase reads into dashboard detail hooks and adding dialog-specific view models.
- Continued Unit 007 dashboard summary cleanup by extracting metric, channel, alert, and sales-trend view-model helpers and removing generated Supabase row dependencies from `ChannelCard`, `AlertsPanel`, and `SalesChart`.
- Continued Unit 007 frontend lint cleanup by excluding generated Supabase types from ESLint, replacing sidebar render-time randomness, migrating notifications to React Query, and removing remaining explicit `any` errors.
- Continued Unit 007 frontend lint cleanup by removing unused imports/variables, replacing the sidebar raw image with `next/image`, and adding targeted TanStack Table React Compiler suppressions.
- Completed the remaining frontend build-warning cleanup by moving root `themeColor` from metadata into the supported Next.js viewport export.
- Added a backend-only enterprise structure migration plan and reusable feature spec for future backend source tree reorganization.
- Implemented Backend Enterprise Structure Unit 1 by moving backend config/bootstrap setup, shared crypto/auth concerns, and order metric derivation into explicit `bootstrap`, `shared`, and `domain` boundaries.
- Continued Backend Enterprise Structure Unit 2 by moving concrete Supabase module, repositories, repository specs, and generated DB types under `backend/src/infrastructure/persistence/supabase`.
- Continued Backend Enterprise Structure Unit 2 by adding store, credential, and alert repository ports plus DI tokens, then migrating `TasksService` and `SyncOutcomeService` to port-based dependencies.
- Continued Backend Enterprise Structure Unit 2 by adding a webhook event repository port and migrating Shopify, Walmart, and TikTok webhook processors to use it.
- Continued Backend Enterprise Structure Unit 2 by adding `ProductsRepositoryPort` and `InventoryRepositoryPort`, wiring `PRODUCTS_REPOSITORY` and `INVENTORY_REPOSITORY` in `JobsModule`, and migrating all seven product sync strategies to port injection.
- Continued Backend Enterprise Structure Unit 2 by adding order, order-item, fulfillment, metric, and return repository ports; extending the product port with `getAllProductsByStore`; migrating all order and return sync strategies to port injection; and switching Amazon/Shopify cursor writes to `updateSyncTimestamps`.
- Completed Backend Enterprise Structure Unit 2 by migrating products/orders/returns processors, all product strategies, `PlatformServiceFactory`, Walmart webhook controller/guard, and connector service dependencies to repository ports; extending the store port for Walmart webhook connect; and standardizing cursor writes on `updateSyncTimestamps`.
- Completed Backend Enterprise Structure Unit 3 by moving connector contracts/policies to `backend/src/application/connectors`, moving per-platform connector factories to `backend/src/infrastructure/external/connectors/registry`, updating jobs/sync imports to the new paths, and keeping compatibility re-exports under `backend/src/connectors/`.
- Completed Unit 3 provider adapter relocation by moving Amazon, Faire, Shopify, Target, TikTok, Walmart, Warehance, and OAuth modules under `backend/src/infrastructure/external/connectors/`, renaming `warehouse` to `warehance`, updating sync strategies/webhooks/codegen paths, and switching connector factories to Nest `ModuleRef.create` instead of manual `new`.
- Completed Backend Enterprise Structure Unit 4 by moving sync strategies, registry, outcomes, and scheduling to `backend/src/application/sync`, moving BullMQ processors to `backend/src/infrastructure/queues/bullmq/processors/`, and leaving `backend/src/jobs/jobs.module.ts` as the sync composition module.
- Completed Backend Enterprise Structure Unit 5 by moving webhook controllers/guards to `interfaces/webhooks`, ingestion/routing/subscription logic to `application/webhooks`, webhook processors to `infrastructure/queues/bullmq/webhooks`, and composition modules to `modules/webhooks/`.
- Completed Backend Enterprise Structure Unit 6 by splitting composition into `modules/persistence.module.ts`, `modules/connectors.module.ts`, and `modules/sync.module.ts`; slimming `AppModule`; and removing legacy `jobs/` and `tasks/` folders.

## Active Unit

None. Backend Enterprise Structure migration is complete.

## Next Unit

None for the backend enterprise structure plan. Future work can move to the next reengineering plan in `client/plans/` or operational follow-ups such as applying Supabase index migrations.

## Open Questions

- Production deployment target is not yet documented.
- Exact Supabase schema constraints/indexes should be reviewed before data-access refactors.
- Team preference for strict e2e coverage vs pragmatic unit/build gates may be revisited before high-risk migrations.

## Session Notes

- User requested backend-first reengineering context, not immediate code changes.
- Future work must preserve current app behavior unless a plan explicitly approves a breaking migration.
- Unit 002 discovery found processors already fetch credentials by `storeId`; the main immediate payload issue is `TasksService` still serializing credentials into scheduled jobs.
- Backend Jest discovers `src/**/*.spec.ts`, so Unit 002 tests should be added under `backend/src`.
- Every original shortcoming now has a primary owning reengineering plan.
- Unit 002 implementation changed scheduled jobs to metadata-only payloads, added deterministic sync job IDs, centralized sync success/failure health updates, and added focused tests for payload building, queueing, and sync outcomes.
- Backend verification passed with `npm.cmd run test` and `npm.cmd run build`.
- Graphify code graph was refreshed after the Unit 002 changes.
- Unit 003 foundation added connector capability metadata for all platforms, required credential-field validation before `PlatformServiceFactory` initializes services, and reusable retry-policy classification/backoff helpers.
- Unit 003 verification passed with `npm.cmd run test` and `npm.cmd run build`; `tsc --noEmit --pretty false` also passed while diagnosing slow Nest build time.
- Jest completed with all tests passing but still reported an open-handle warning after completion; this appears to be an existing test teardown issue, not a connector assertion failure.
- Graphify code graph was refreshed after the Unit 003 connector-boundary changes.
- Unit 003 strategy dispatch added a shared `SyncStrategyRegistry` and wired products, orders, and returns processors through domain strategy registries instead of direct platform switch statements.
- Unit 003 strategy dispatch verification passed with `npm.cmd run test` and `npm.cmd run build`.
- Graphify code graph was refreshed after the Unit 003 strategy dispatch changes.
- Unit 003 Shopify product strategy extraction moved Shopify product/inventory sync logic into `ShopifyProductsStrategy` and registered it through `JobsModule`.
- Shopify strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Graphify code graph was refreshed after the Shopify product strategy extraction.
- Unit 003 Faire product strategy extraction moved Faire product/inventory sync logic into `FaireProductsStrategy` and registered it through `JobsModule`.
- Faire strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Graphify code graph was refreshed after the Faire product strategy extraction.
- Unit 003 Target product strategy extraction moved Target product/inventory sync logic into `TargetProductsStrategy` and registered it through `JobsModule`.
- Target strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Graphify code graph was refreshed after the Target product strategy extraction.
- Unit 003 Walmart product strategy extraction moved Walmart product/adaptive-inventory sync logic into `WalmartProductsStrategy` and registered it through `JobsModule`.
- Walmart strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Graphify code graph was refreshed after the Walmart product strategy extraction.
- Unit 003 Amazon product strategy extraction moved Amazon listing/FBA-inventory sync logic into `AmazonProductsStrategy` and registered it through `JobsModule`.
- Amazon strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Graphify code graph was refreshed after the Amazon product strategy extraction.
- Unit 003 Warehance product strategy extraction moved Warehance product/inventory sync logic into `WarehanceProductsStrategy` and registered it through `JobsModule`.
- Warehance strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Graphify code graph was refreshed after the Warehance product strategy extraction.
- Unit 003 TikTok product strategy extraction moved TikTok product/inventory sync logic into `TikTokProductsStrategy` and registered it through `JobsModule`.
- `ProductsProcessor` now owns only job context loading, platform service creation, strategy dispatch, and sync outcome recording for product jobs.
- TikTok/product strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the existing post-success open-handle warning.
- Graphify code graph was refreshed after the TikTok product strategy extraction.
- Unit 003 Faire order strategy extraction moved Faire order/item/shipment/metric sync logic into `FaireOrdersStrategy` and registered it through `JobsModule`.
- Faire order extraction fixed a pre-existing product remap bug: order items and fulfillments are now mapped after product and order ID maps are available instead of losing product IDs before remapping.
- Faire order strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the existing post-success open-handle warning.
- Graphify code graph was refreshed after the Faire order strategy extraction.
- Unit 003 Target order strategy extraction moved Target order/item/fulfillment/metric sync logic into `TargetOrdersStrategy` and registered it through `JobsModule`.
- Target order strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the existing post-success open-handle warning.
- Graphify code graph was refreshed after the Target order strategy extraction.
- Unit 003 Walmart order strategy extraction moved Walmart order/item/fulfillment/metric sync logic into `WalmartOrdersStrategy` and registered it through `JobsModule`.
- Walmart order strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Graphify code graph was refreshed after the Walmart order strategy extraction.
- Unit 003 Amazon order strategy extraction moved first-sync flat-file report handling, incremental API order/item/shipment handling, kiosk metric upsert, and cursor update into `AmazonOrdersStrategy`.
- Amazon order strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Amazon order extraction preserved existing kiosk `console.log` behavior; remove that under the log-safety/security cleanup unit.
- Graphify code graph was refreshed after the Amazon order strategy extraction.
- Unit 003 Warehance order strategy extraction moved Warehance order/item deduplication, shipment mapping, metric sync, and failure alert behavior into `WarehanceOrdersStrategy`.
- Warehance order strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the intermittent post-success open-handle warning.
- TypeScript declaration portability required an explicit return type on `ReturnsRepository.insertReturns`; behavior is unchanged.
- Graphify code graph was refreshed after the Warehance order strategy extraction.
- Unit 003 Shopify order strategy extraction moved Shopify order/item/fulfillment/metric sync logic into `ShopifyOrdersStrategy` and registered it through `JobsModule`.
- Shopify order strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the intermittent post-success open-handle warning.
- Graphify code graph was refreshed after the Shopify order strategy extraction.
- Unit 003 TikTok order strategy extraction moved TikTok order/item/fulfillment/analytics sync logic into `TikTokOrdersStrategy` and registered it through `JobsModule`.
- `OrdersProcessor` is now a thin orchestration boundary for order jobs: store lookup, credential lookup, platform service creation, strategy dispatch, and sync outcome recording.
- TikTok order strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Graphify code graph was refreshed after the TikTok order strategy extraction.
- Unit 003 Target return strategy extraction moved Target return fetching, external-order lookup, FK-safe order remapping, return insertion, and failure alert behavior into `TargetReturnsStrategy`.
- Target return strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Graphify code graph was refreshed after the Target return strategy extraction.
- Unit 003 Walmart return strategy extraction moved Walmart return fetching, external-order lookup, FK-safe order remapping, return insertion, and failure alert behavior into `WalmartReturnsStrategy`.
- Walmart return strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the intermittent post-success open-handle warning.
- Graphify code graph was refreshed after the Walmart return strategy extraction.
- Unit 003 Amazon return strategy extraction moved Amazon return report fetching, external-order lookup, FK-safe order remapping, return insertion, and failure alert behavior into `AmazonReturnsStrategy`.
- Amazon return strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Graphify code graph was refreshed after the Amazon return strategy extraction.
- Unit 003 Shopify return strategy extraction moved Shopify return fetching, DB order resolution, return deduplication, return insertion, and returns cursor update into `ShopifyReturnsStrategy`.
- Shopify return strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Graphify code graph was refreshed after the Shopify return strategy extraction.
- Unit 003 TikTok return strategy extraction moved TikTok return fetching, external-order lookup, FK-safe order remapping, return insertion, and failure alert behavior into `TikTokReturnsStrategy`.
- `ReturnsProcessor` is now a thin orchestration boundary for return jobs: store lookup, credential lookup, platform service creation, strategy dispatch, unsupported-platform handling, and sync outcome recording. Stale repository dependencies from the old inline handlers were removed.
- TikTok return strategy verification passed with focused strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the intermittent post-success open-handle warning.
- Graphify code graph was refreshed after the TikTok return strategy extraction.
- Unit 004 Shopify webhook durability replaced fake direct `enqueue -> process` behavior with raw event persistence, duplicate suppression, a `shopify-webhooks` BullMQ queue, deterministic webhook job IDs, and worker-side topic routing logs.
- Shopify webhook durability verification passed with focused processor tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the intermittent post-success open-handle warning.
- Unit 004 Walmart webhook durability replaced fake direct `enqueue -> process` behavior with raw event persistence, duplicate suppression, a `walmart-webhooks` BullMQ queue, deterministic webhook job IDs, and worker-side topic routing logs.
- Walmart webhook durability also removed a decrypted Walmart client credential `console.log` from the connect path.
- Walmart webhook durability verification passed with focused processor tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the intermittent post-success open-handle warning.
- Unit 004 TikTok webhook durability moved controller-side post-signature work to a `tiktok-webhooks` BullMQ queue. The queue job carries small identifiers, the raw payload is persisted once through `EventsRepository`, and the worker loads the stored payload by `rawEventId` before running the existing TikTok side-effect handlers.
- TikTok per-handler raw event inserts were removed in favor of one shared raw webhook record per notification.
- TikTok webhook durability verification passed with focused processor tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Unit 005 log-safety cleanup removed Shopify/TikTok OAuth token response logs, Walmart webhook token logging, Amazon kiosk data console output, repository `console.log(error)` calls, mapper console noise, and raw bootstrap/controller `console.error` usage in active backend code.
- Protected/generated `backend/src/libs/tiktok/` files still contain console examples/debug code and were intentionally left unchanged per `client/context/code-standards.md`.
- Unit 005 log-safety verification passed with `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the intermittent post-success open-handle warning.
- Unit 005 auth guard cleanup changed `MyAuthGuard` to parse `Authorization: Bearer <token>` and return only the token, including whitespace-tolerant and case-insensitive Bearer handling.
- Auth guard cleanup verification passed with focused guard tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the intermittent post-success open-handle warning.
- Unit 005 credential contract tightening added platform-specific credential interfaces, a typed `ConnectorCredentialsByPlatform` map, and `getValidatedConnectorCredentials` so `PlatformServiceFactory` no longer passes generic `any` credentials into connector creation.
- TikTok credential validation remains intentionally permissive because `TikTokService` initializes from app config and resolves per-store access through `TikTokOAuthService`.
- Credential contract verification passed with focused credential tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Unit 006 metric derivation performance changed `deriveMetricsFromOrders` from nested scans over all order items and fulfillments per order to precomputed `order_id` maps.
- Metric derivation verification passed with focused mapper tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the intermittent post-success open-handle warning on some full-suite runs.
- Unit 006 repository lookup performance changed `OrdersRepository.getByExternalOrderIds` to dedupe/filter IDs and query external order IDs in batches, avoiding oversized `.in()` requests.
- Unit 006 product lookup performance simplified `ProductsRepository.getProductIdsBySkusInBatches` so SKU dedupe happens once and the existing `getIdsBySkus` batching path is reused instead of double-batching with artificial delay.
- Repository lookup verification passed with focused repository tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the intermittent post-success open-handle warning on the full suite.
- Unit 006 return write performance changed `ReturnsRepository.insertReturns` from one unbounded upsert to fixed-size batched upserts while preserving the existing `{ data, error }` repository contract.
- Return write batching verification passed with focused returns repository tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the intermittent post-success open-handle warning on the full suite.
- Unit 006 index review added `backend/supabase/migrations/20260611_sync_hot_path_indexes.sql` with non-unique supporting indexes for active-store polling, store credential lookup, order/product/inventory/return resolution, metric upserts, fulfillment lookup, and raw webhook event queries.
- Index review verification passed with `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the intermittent post-success open-handle warning on the full suite.
- Unit 006 order product lookup cleanup changed Shopify, TikTok, Walmart, and Target order strategies to resolve product IDs from only the SKUs present in the fetched orders instead of loading every product for the store first.
- Target order cleanup also fixed the lookup key to use Target order-line SKUs via the existing SKU resolver, matching how Target product sync stores `external_id` as `sku`.
- Scoped order lookup verification passed with focused affected order strategy tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the intermittent post-success open-handle warning on the full suite.
- Unit 006 identifier lookup cleanup added `ProductsRepository.getProductIdsByIdentifiers` for SKU, external product ID, and ASIN resolution without loading the full product catalog.
- Amazon order sync now resolves only ASIN/SKU identifiers from the current flat-file or incremental order-item batch, and Warehance order sync resolves only current order item SKUs plus shipment parcel product IDs.
- Identifier lookup verification passed with focused ProductsRepository/Amazon/Warehance tests plus `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Unit 007 frontend domain cleanup started by adding `frontend/modules/dashboard/domain/product-view-models.ts` and adapting `ProductsTable` to consume `ProductTableRow` instead of generated Supabase product rows.
- Frontend build passed after allowing network access for Google Fonts. Frontend lint remains blocked by pre-existing unrelated errors, including generated `frontend/types/supabase.types.ts` parsing as binary, existing `any` usage, React Compiler issues, and unused variables outside this slice.
- Unit 007 dashboard table cleanup continued by extending the view-model adapter to inventory, order, and return tables and adapting `InventoryTable`, `OrdersTable`, and `ReturnsTable` to consume camelCase domain rows instead of raw Supabase table rows.
- Frontend build passed for the dashboard table cleanup slice. Frontend lint remains blocked by the pre-existing repo-wide lint baseline; this slice removed some unused-import warnings but did not clear the existing generated-type parse, `any`, or React Compiler errors.
- Unit 007 dashboard detail cleanup added `frontend/modules/dashboard/domain/dialog-view-models.ts` and `frontend/modules/dashboard/hooks/use-dashboard-detail-dialogs.ts`.
- `ProductDialog`, `OrderDialog`, and `ReturnDialog` no longer create Supabase clients or depend directly on generated Supabase row types; they render query results from dashboard detail hooks as view models.
- The dashboard hook memoization warning was fixed by stabilizing the active store ID dependency, and two unused dashboard warnings were removed.
- Frontend build passed after the dialog cleanup. Frontend lint still fails on the existing baseline: explicit `any` in credential/API/crypto/table code, React Compiler purity/effect issues outside this slice, generated `supabase.types.ts` parsing as binary, and unrelated unused variables.
- Unit 007 dashboard summary cleanup added `frontend/modules/dashboard/domain/summary-view-models.ts`.
- `DashboardView` now delegates metric totals, per-store channel rows, sales trend buckets, and alert panel rows to domain helpers instead of shaping those records inline.
- `ChannelCard`, `AlertsPanel`, and `SalesChart` now consume domain view models rather than generated Supabase row/enum types.
- Frontend build passed after the summary cleanup. Frontend lint remains at the existing baseline of 38 problems: 7 errors and 31 warnings.
- Unit 007 frontend lint cleanup fixed the hard lint errors: generated `frontend/types/supabase.types.ts` is ignored by ESLint, `SidebarMenuSkeleton` no longer calls `Math.random()` during render, `useNotifications` now uses React Query instead of synchronous set-state-in-effect loading, and explicit `any` annotations were removed from credentials, Warehance API, virtualized table, and crypto code.
- Frontend build passed after the lint cleanup. Frontend lint now passes with warnings only: 30 warnings and 0 errors.
- Unit 007 warning cleanup removed dead imports/destructures across layout, auth, dashboard, events, integrations, notifications, settings, team, and combobox components.
- The dashboard app sidebar now uses `next/image` for stable-size integration icons.
- TanStack Table React Compiler warnings are intentionally suppressed at the `useReactTable` calls with local comments because the warning is library-specific and the table helpers are expected to be non-memoizable.
- Frontend lint now exits with 0 errors and 0 warnings. Frontend build passes, with only Next.js route metadata `themeColor` build warnings remaining.
- Root app metadata now uses `export const viewport` for `themeColor`, which removes the repeated Next.js route build warnings.
- Frontend lint passes with 0 warnings and frontend build passes with clean output.
- Backend enterprise structure plan added at `client/plans/007-backend-enterprise-structure.md`.
- Backend enterprise implementation prompt/spec added at `client/context/feature-specs/backend-enterprise-architecture.md`.
- Unit 1 moved `backend/src/config` to `backend/src/bootstrap/config`, extracted HTTP app setup to `backend/src/bootstrap/http/app-bootstrap.ts`, replaced `CommonModule` with `SharedModule`, moved crypto/auth guard code under `backend/src/shared`, and moved order metric derivation to `backend/src/domain/metrics`.
- Unit 1 verification passed with `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the existing post-success open-handle warning.
- Unit 2 first slice moved `backend/src/supabase` to `backend/src/infrastructure/persistence/supabase` and updated imports across jobs, connectors, webhooks, tasks, and tests.
- Unit 2 first-slice verification passed with `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Unit 2 repository-port slice added `backend/src/domain/repositories/repository-ports.ts`, introduced store/credential/alert ports and tokens, wired them through `JobsModule`, and migrated `TasksService` plus `SyncOutcomeService` to token-based port injection.
- Unit 2 repository-port verification passed with `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`; Jest still reports the existing post-success open-handle warning.
- Unit 2 webhook-event port slice added `WebhookEventsRepositoryPort`, wired the token in Shopify/Walmart/TikTok webhook modules, and migrated webhook processors away from direct `EventsRepository` dependencies.
- Unit 2 webhook-event verification passed with focused webhook processor specs, `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test`, and `npm.cmd run build`.
- Unit 2 product/inventory port slice added shared product and inventory repository ports with the method surface used by product strategies: `insertProducts`, `syncProductsAndInventory`, `getIdsBySkus`, `getProductIdsByIdentifiers`, `getProductIdsBySkusInBatches`, `updateInventory`, `updateInventoryBatch`, and `getBySkus`.
- Unit 2 product strategy migration updated Amazon, Faire, Shopify, Target, TikTok, Walmart, and Warehance product strategies to inject `ProductsRepositoryPort` and `InventoryRepositoryPort`.
- Unit 2 product/inventory verification passed with `npx.cmd tsc --noEmit --pretty false`, focused product strategy specs (7 suites, 18 tests), `npm.cmd run test` (35 suites, 98 tests), and `npm.cmd run build`; Jest still reports the existing post-success open-handle warning.
- Unit 2 order/return port slice added `OrdersRepositoryPort`, `OrderItemsRepositoryPort`, `FulfillmentsRepositoryPort`, `MetricsRepositoryPort`, and `ReturnsRepositoryPort`, extended the product port with `getAllProductsByStore`, and migrated all seven order strategies plus all five return strategies to port injection.
- Unit 2 order/return verification passed with `npx.cmd tsc --noEmit --pretty false`, focused order/return strategy specs (12 suites, 24 tests), `npm.cmd run test` (35 suites, 98 tests), and `npm.cmd run build`; Jest still reports the existing post-success open-handle warning.
- Unit 2 processor/product-strategy/factory/webhook closure migrated queue processors, all product strategies, `PlatformServiceFactory`, Walmart webhook controller/guard, and connector service types to repository ports; extended the store port for Walmart webhook connect; and switched Amazon product cursor writes to `updateSyncTimestamps`.
- Unit 2 closure verification passed with `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test` (35 suites, 98 tests), and `npm.cmd run build`; Jest still reports the existing post-success open-handle warning.
- Unit 3 connector registry slice added `ConnectorServiceFactory`, `ConnectorRegistryService`, and per-platform connector factories for all seven platforms under `backend/src/connectors/registry`.
- Unit 3 refactored `PlatformServiceFactory` to validate credentials and delegate connector creation to the registry instead of constructing provider services inline.
- Unit 3 verification passed with `npx.cmd tsc --noEmit --pretty false`, focused registry specs (1 suite, 3 tests), `npm.cmd run test` (36 suites, 101 tests), and `npm.cmd run build`; Jest still reports the existing post-success open-handle warning.
- Unit 3 folder restructure moved connector contracts to `backend/src/application/connectors`, registry service to `backend/src/application/connectors/registry`, and adapter factories to `backend/src/infrastructure/external/connectors/registry`.
- Unit 3 folder restructure verification passed with `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test` (36 suites, 101 tests), and `npm.cmd run build`; Jest still reports the existing post-success open-handle warning.
- Unit 3 provider adapter relocation verification passed with `npm.cmd run build`, `npm.cmd run test` (36 suites, 101 tests); connector factories now use Nest `ModuleRef.create` for per-job service instances.
- Unit 4 sync module restructure moved orchestration to `backend/src/application/sync`, processors to `backend/src/infrastructure/queues/bullmq/processors/`, and scheduling to `application/sync/scheduling/sync-scheduler.service.ts`.
- Unit 4 verification passed with `npx.cmd tsc --noEmit --pretty false`, `npm.cmd run test` (36 suites, 101 tests), and `npm.cmd run build`.
- Unit 5 webhook restructure split HTTP controllers/guards, application ingestion/routing, and infrastructure BullMQ processors into separate layers under `interfaces/webhooks`, `application/webhooks`, and `infrastructure/queues/bullmq/webhooks`.
- Unit 6 module cleanup added `modules/persistence.module.ts`, refactored `modules/connectors.module.ts`, added `modules/sync.module.ts`, slimmed `AppModule`, and removed legacy `jobs/` and `tasks/`.
- Unit 6 verification passed with `npm.cmd run build`, `npm.cmd run test` (36 suites, 101 tests); Jest still reports the existing post-success open-handle warning.
