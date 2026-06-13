# Decisions Log

## 2026-06-09 - Context Scaffold Location

- Decision: Store project context under `client/`.
- Consequence: Future implementation sessions must read `client/AGENTS.md` first.

## 2026-06-09 - Reengineering Mode

- Decision: Backend-first reengineering.
- Consequence: Sync engine, connectors, webhooks, credentials, and data access are prioritized before frontend cleanup.

## 2026-06-09 - Feature-Spec Organization

- Decision: Use domain feature-specs.
- Consequence: Specs map to product/architecture domains instead of only mirroring folders.

## 2026-06-09 - Compatibility

- Decision: Preserve current behavior incrementally.
- Consequence: Existing routes, queues, tables, and UI behavior remain compatible unless a later plan explicitly approves migration.

## 2026-06-09 - Verification Standard

- Decision: Pragmatic verification.
- Consequence: Use focused unit tests plus backend/frontend build and lint gates rather than requiring full e2e coverage for every unit.

## 2026-06-09 - Generated Code Policy

- Decision: Generated/vendor code is protected and non-authoritative for architecture.
- Consequence: Do not edit or rely on generated SDK/API/type files as design guidance unless the active task targets regeneration.

## 2026-06-09 - Unit 002 Sync Payload Shape

- Decision: Scheduled sync job payloads must contain store/platform/org/domain/cursor metadata only, never credentials.
- Consequence: Workers continue loading credentials by `storeId`, and Redis job data no longer carries secret material.

## 2026-06-09 - Unit 002 Job ID Format

- Decision: Use deterministic job IDs in the form `sync:<domain>:<storeId>:<cursorKey>`.
- Consequence: Repeated polling for the same store/domain/window is idempotent and avoids unbounded duplicate queued work.

## 2026-06-09 - Shortcomings Traceability

- Decision: Maintain `plans/reengineering/000-shortcomings-traceability.md` as the mapping from discovered problems to owning plans.
- Consequence: Future work must update the traceability file if ownership changes or a new systemic shortcoming is discovered.

## 2026-06-09 - Frontend Generated Type Boundary

- Decision: Treat `frontend/types/supabase.types.ts` as a schema reference, not a presentational UI model source.
- Consequence: Frontend cleanup should introduce domain hooks/view models before passing data into components.

## 2026-06-10 - Unit 002 Sync Outcome Boundary

- Decision: Centralize scheduled sync success/failure health updates in a shared sync outcome service.
- Consequence: Queue processors can share consistent store health and alert behavior while platform-specific mapping remains in place until the connector-boundary unit.

## 2026-06-10 - Backend Build Portability

- Decision: Replace the Unix-only backend build copy command with a Node-based file copy.
- Consequence: `npm.cmd run build` works on Windows and remains compatible with CI environments that have Node available.

## 2026-06-10 - Unit 003 Connector Capability Registry

- Decision: Introduce a central connector capability registry before migrating processors to strategy adapters.
- Consequence: Supported domains, OAuth/webhook support, cursor mode, and rate-limit profiles are now explicit per platform.

## 2026-06-10 - Unit 003 Credential Preflight

- Decision: Validate required credential fields in `PlatformServiceFactory.createService` before initializing provider clients.
- Consequence: Bad stored credentials fail early with a platform-specific error instead of entering partial connector initialization.

## 2026-06-10 - Unit 003 Strategy Dispatch Boundary

- Decision: Add a shared sync strategy registry and route products, orders, and returns processors through domain registries.
- Consequence: The processors no longer use direct platform switch statements for normal sync dispatch, while existing platform handler bodies stay in place until they are extracted into injectable adapters.

## 2026-06-10 - Unit 003 Product Strategy Extraction Order

- Decision: Start handler extraction with Shopify products.
- Consequence: The extraction pattern is proven on a real product/inventory flow before tackling the more complex Amazon and Walmart product paths.

## 2026-06-10 - Unit 003 Faire Product Strategy Extraction

- Decision: Extract Faire products after Shopify products.
- Consequence: Two product paths now use injectable strategies, and the remaining product extraction pattern should continue with Target before Walmart and Amazon.

## 2026-06-10 - Unit 003 Target Product Strategy Extraction

- Decision: Extract Target products after Faire products.
- Consequence: Three product paths now use injectable strategies, and `ProductsProcessor` is ready for the more complex Walmart/Amazon extraction steps.

## 2026-06-10 - Unit 003 Walmart Product Strategy Extraction

- Decision: Extract Walmart products after Target products.
- Consequence: Adaptive Walmart inventory fetching and delta checks are now isolated behind an injectable strategy, leaving Amazon, Warehance, and TikTok as the remaining product processor extractions.

## 2026-06-10 - Unit 003 Amazon Product Strategy Extraction

- Decision: Extract Amazon products after Walmart products.
- Consequence: Amazon listing snapshot sync, FBA inventory delta checks, and product cursor update are now isolated behind an injectable strategy, leaving Warehance and TikTok as the remaining product processor extractions.

## 2026-06-10 - Unit 003 Warehance Product Strategy Extraction

- Decision: Extract Warehance products after Amazon products.
- Consequence: Warehance product and inventory delta logic is now isolated behind an injectable strategy, leaving TikTok as the final product processor extraction.

## 2026-06-10 - Unit 003 TikTok Product Strategy Extraction

- Decision: Extract TikTok products as the final product processor strategy.
- Consequence: `ProductsProcessor` is now a thin orchestration boundary for product jobs, and the next connector-boundary extraction should target orders or returns.

## 2026-06-10 - Unit 003 Faire Order Strategy Extraction

- Decision: Start order handler extraction with Faire.
- Consequence: `OrdersProcessor` has its first injectable order strategy, and the extraction uncovered and fixed the existing Faire product-ID remap bug by remapping items/shipments only after product and order ID maps are available.

## 2026-06-10 - Unit 003 Target Order Strategy Extraction

- Decision: Extract Target orders after Faire orders.
- Consequence: Target order, order item, fulfillment, and metric sync now live behind an injectable strategy, leaving Walmart, Amazon, Warehance, Shopify, and TikTok as the remaining order processor extractions.

## 2026-06-10 - Unit 003 Walmart Order Strategy Extraction

- Decision: Extract Walmart orders after Target orders.
- Consequence: Walmart order, line-item, shipped/delivered fulfillment, and metric sync now live behind an injectable strategy, leaving Amazon, Warehance, Shopify, and TikTok as the remaining order processor extractions.

## 2026-06-10 - Unit 003 Amazon Order Strategy Extraction

- Decision: Extract Amazon orders after Walmart orders.
- Consequence: Amazon first-sync flat-file reports, incremental order/item fetching, shipment mapping, kiosk metric upsert, and order cursor updates now live behind an injectable strategy. The existing kiosk data `console.log` was preserved for behavior compatibility and should be removed in the security/log-safety unit.

## 2026-06-10 - Unit 003 Warehance Order Strategy Extraction

- Decision: Extract Warehance orders after Amazon orders.
- Consequence: Warehance order upsert, item deduplication, shipment mapping, metric sync, and failure alert behavior now live behind an injectable strategy, leaving Shopify and TikTok as the remaining order processor extractions.

## 2026-06-10 - Unit 003 Shopify Order Strategy Extraction

- Decision: Extract Shopify orders after Warehance orders.
- Consequence: Shopify order, order-item, fulfillment, and ShopifyQL metric sync now live behind an injectable strategy, leaving TikTok as the final order processor extraction.

## 2026-06-10 - Unit 003 TikTok Order Strategy Extraction

- Decision: Extract TikTok orders as the final order processor strategy.
- Consequence: TikTok order, line-item, package fulfillment, and GMV analytics sync now live behind an injectable strategy, and `OrdersProcessor` is now a thin orchestration boundary for order jobs.

## 2026-06-10 - Unit 003 Target Return Strategy Extraction

- Decision: Start return handler extraction with Target.
- Consequence: Target return fetching, external-order resolution, FK-safe order remapping, and return insertion now live behind an injectable strategy, leaving Walmart, Amazon, Shopify, and TikTok as the remaining return processor extractions.

## 2026-06-10 - Unit 003 Walmart Return Strategy Extraction

- Decision: Extract Walmart returns after Target returns.
- Consequence: Walmart return fetching, external-order resolution, FK-safe order remapping, and return insertion now live behind an injectable strategy, leaving Amazon, Shopify, and TikTok as the remaining return processor extractions.

## 2026-06-10 - Unit 003 Amazon Return Strategy Extraction

- Decision: Extract Amazon returns after Walmart returns.
- Consequence: Amazon FBA return report fetching, external-order resolution, FK-safe order remapping, and return insertion now live behind an injectable strategy, leaving Shopify and TikTok as the remaining return processor extractions.

## 2026-06-10 - Unit 003 Shopify Return Strategy Extraction

- Decision: Extract Shopify returns after Amazon returns.
- Consequence: Shopify return fetching, DB order resolution, return deduplication, return insertion, and returns cursor update now live behind an injectable strategy, leaving TikTok as the final return processor extraction.

## 2026-06-10 - Unit 003 TikTok Return Strategy Extraction

- Decision: Extract TikTok returns as the final return processor strategy.
- Consequence: TikTok return fetching, external-order resolution, FK-safe order remapping, and return insertion now live behind an injectable strategy, and `ReturnsProcessor` is now a thin orchestration boundary for return jobs.

## 2026-06-10 - Unit 004 Shopify Webhook Durable Enqueue

- Decision: Start webhook durability with Shopify by persisting raw events before enqueueing durable BullMQ jobs.
- Consequence: Shopify no longer uses fake direct `enqueue -> process` behavior; duplicate webhook IDs are suppressed, queued work uses deterministic job IDs, and the same raw-event repository can be reused by Walmart and TikTok cleanup.

## 2026-06-10 - Unit 004 Walmart Webhook Durable Enqueue

- Decision: Apply the same raw-event-before-queue pattern to Walmart webhooks and remove decrypted credential logging from Walmart connection setup.
- Consequence: Walmart no longer uses fake direct `enqueue -> process` behavior; duplicate event IDs are suppressed, queued work uses deterministic job IDs, and one credential leak is closed before the broader log-safety cleanup.

## 2026-06-10 - Unit 004 TikTok Webhook Durable Enqueue

- Decision: Move TikTok webhook side effects out of the HTTP request path by persisting the raw notification once, enqueueing a small BullMQ job, and loading the stored payload in the worker.
- Consequence: TikTok webhooks now acknowledge after signature verification and durable enqueueing, while existing order/inventory/return/deauth side effects run from the worker through the same service handlers.

## 2026-06-10 - Unit 005 Runtime Log Safety

- Decision: Remove raw `console.*` usage from active backend runtime code and never print OAuth tokens, credential payloads, webhook tokens, or raw provider responses.
- Consequence: Backend logging now goes through Nest loggers or is omitted for noisy mapper/repository internals; protected generated TikTok SDK files are left untouched until a regeneration plan exists.

## 2026-06-11 - Unit 005 Bearer Token Extraction

- Decision: `MyAuthGuard` must parse the `Authorization` header and pass only the Bearer token to Supabase auth.
- Consequence: Malformed or non-Bearer authorization headers are rejected early by returning no token, while normal/case-insensitive Bearer headers continue to work.

## 2026-06-11 - Unit 005 Typed Credential Contracts

- Decision: Represent connector credentials with platform-specific TypeScript interfaces and validate credentials through `getValidatedConnectorCredentials` before factory construction.
- Consequence: `PlatformServiceFactory` now receives narrowed credential shapes for Amazon, Walmart, Shopify, Faire, Target, and Warehance; TikTok remains permissive until its OAuth-backed store credential model is migrated explicitly.

## 2026-06-11 - Unit 006 Metric Derivation Indexing

- Decision: Pre-index order items and fulfillments by `order_id` before deriving metrics from synced orders.
- Consequence: Metric derivation no longer does full related-row scans for every order, preserving behavior while reducing work on larger order batches.

## 2026-06-11 - Unit 006 Repository Lookup Batching

- Decision: Batch large external order ID lookups and dedupe SKU/order lookup inputs before querying.
- Consequence: Repository calls avoid oversized `.in()` requests and redundant product ID lookup loops while preserving existing sync strategy APIs.

## 2026-06-11 - Unit 006 Return Write Batching

- Decision: Write returns through fixed-size repository upsert batches instead of one unbounded Supabase upsert.
- Consequence: Return sync strategies keep the same `{ data, error }` contract while large return payloads avoid oversized write requests.

## 2026-06-11 - Unit 006 Sync Hot-Path Indexes

- Decision: Add non-unique supporting indexes for sync and webhook read/write hot paths without changing existing uniqueness or upsert conflict semantics.
- Consequence: Active-store polling, credential lookup, order/product/inventory/return resolution, fulfillment lookup, metric upserts, and raw event queries get explicit database support while data model constraints remain unchanged.

## 2026-06-11 - Unit 006 Scoped Order Product Lookups

- Decision: Resolve product IDs for Shopify, TikTok, Walmart, and Target order sync from only the SKUs present in the fetched order batch instead of loading every product for the store.
- Consequence: Order sync reduces unnecessary product-table reads on large stores, and Target order item/fulfillment product mapping now uses the same SKU key that Target product sync writes.

## 2026-06-11 - Unit 006 Identifier-Scoped Product Lookup

- Decision: Add a product repository method that resolves current-batch product IDs by SKU, external product ID, and ASIN.
- Consequence: Amazon and Warehance order sync no longer need full-catalog product reads for product mapping, while their multi-identifier mapping behavior remains explicit and reusable.

## 2026-06-11 - Unit 007 Product Table View Model

- Decision: Introduce dashboard product table view models and adapt raw Supabase product rows before passing data into `ProductsTable`.
- Consequence: The product table no longer depends directly on generated Supabase product row types, establishing the frontend domain-boundary pattern for the remaining dashboard tables.

## 2026-06-11 - Unit 007 Dashboard Table View Models

- Decision: Extend the dashboard table view-model boundary to inventory, orders, and returns alongside products.
- Consequence: The four dashboard table components no longer depend directly on generated Supabase row shapes; generated types are localized to the dashboard adapter/view layer before presentational table rendering.

## 2026-06-11 - Unit 007 Dashboard Detail Hooks

- Decision: Move product, order, and return detail-dialog Supabase reads into dashboard hooks and map results through dialog-specific view models.
- Consequence: Dashboard detail dialogs no longer construct Supabase clients or render generated table row shapes directly; query ownership is centralized in hooks and UI components receive stable camelCase view models.

## 2026-06-11 - Unit 007 Dashboard Summary View Models

- Decision: Move dashboard metric, channel, alert, and sales-trend shaping into domain view-model helpers.
- Consequence: `DashboardView` no longer owns the bulk of dashboard record transformation, and `ChannelCard`, `AlertsPanel`, and `SalesChart` consume stable UI-facing view models instead of generated Supabase row or enum types.

## 2026-06-11 - Unit 007 Frontend Lint Error Gate

- Decision: Treat generated Supabase types as lint-ignored generated output, replace render-time randomness with deterministic values, use React Query for notification fetching, and remove explicit `any` from the remaining frontend lint errors.
- Consequence: `npm run lint` now exits successfully with warnings only, while generated type safety remains available to TypeScript and runtime behavior stays compatible.

## 2026-06-11 - Unit 007 Frontend Lint Warning Gate

- Decision: Remove unused frontend code warnings and locally suppress the two TanStack Table React Compiler warnings at the `useReactTable` call sites with an explicit rationale.
- Consequence: Frontend lint is now a clean gate with 0 errors and 0 warnings, while avoiding a risky table rewrite solely to satisfy compiler optimization heuristics.

## 2026-06-11 - Unit 007 Next Metadata Cleanup

- Decision: Move root `themeColor` from the Next.js metadata export to the supported viewport export.
- Consequence: Frontend production builds no longer emit repeated unsupported metadata warnings for every route.

## 2026-06-11 - Backend Enterprise Structure Migration

- Decision: Restructure the backend toward domain/application/infrastructure/interfaces/modules/shared/bootstrap boundaries through incremental migration units instead of a big-bang move.
- Consequence: The backend source tree can be cleaned up while preserving queue names, routes, Supabase schema, provider behavior, and generated-code boundaries. The plan lives at `client/plans/007-backend-enterprise-structure.md`, and the reusable implementation prompt/spec lives at `client/context/feature-specs/backend-enterprise-architecture.md`.

## 2026-06-11 - Backend Enterprise Unit 1 Boundary Split

- Decision: Move runtime config/bootstrap setup, reusable crypto/auth concerns, and order metric derivation out of the old `common`/`config` technical buckets before touching persistence or connector boundaries.
- Consequence: `backend/src/common` and `backend/src/config` no longer own source files. Config now lives under `bootstrap/config`, HTTP app setup is isolated in `bootstrap/http`, crypto/auth live under `shared`, and order metric derivation lives under `domain/metrics` without importing generated Supabase types.

## 2026-06-11 - Backend Enterprise Unit 2 Supabase Infrastructure Ownership

- Decision: Move the concrete Supabase module, repositories, repository specs, and generated database types under `backend/src/infrastructure/persistence/supabase` before introducing repository ports.
- Consequence: Persistence implementation ownership is now explicit and behavior-preserving. Application code still imports concrete repositories in this slice, so repository ports remain the next Unit 2 dependency-inversion step.

## 2026-06-12 - Backend Enterprise Unit 2 First Repository Ports

- Decision: Start repository dependency inversion with stores, store credentials, and alerts because they are shared by scheduled tasks and sync outcome handling.
- Consequence: `TasksService` and `SyncOutcomeService` now depend on domain repository ports and DI tokens instead of concrete Supabase repository classes. Sync success timestamp writes are behind the stores repository port, so `SyncOutcomeService` no longer needs direct Supabase client access.

## 2026-06-12 - Backend Enterprise Unit 2 Webhook Event Port

- Decision: Add a webhook event repository port before migrating larger sync repositories because webhook raw-event persistence has a small, well-contained surface.
- Consequence: Shopify, Walmart, and TikTok webhook processors now depend on `WebhookEventsRepositoryPort`, while each webhook module maps the token to the concrete Supabase `EventsRepository`.
