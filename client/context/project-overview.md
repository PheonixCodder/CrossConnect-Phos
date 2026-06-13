# Project Overview

## Product

CrossConnect-Phos is a multi-channel commerce operations platform. It centralizes marketplace and warehouse data for stores connected to Amazon, Walmart, Shopify, TikTok, Faire, Target, and Warehance so operators can monitor products, inventory, orders, returns, alerts, events, and integration health from one dashboard.

## Users

- Ecommerce operators managing multiple sales channels.
- Operations teams responsible for inventory/order reliability.
- Admins managing organizations, stores, credentials, and team access.
- Developers maintaining connector, sync, webhook, and dashboard behavior.

## Core Workflow

1. User signs in and selects or creates an organization.
2. User connects stores/integrations and provides platform credentials or OAuth authorization.
3. Backend scheduled tasks enqueue product, order, and return sync work.
4. Platform connectors fetch marketplace/warehouse data.
5. Repositories persist normalized rows into Supabase.
6. Frontend dashboard shows metrics, tables, alerts, events, store status, and integration controls.
7. Webhooks receive platform events and should update or enqueue downstream processing.

## Current Feature Areas

- Auth and onboarding.
- Dashboard metrics, channel cards, inventory/orders/products/returns tables, dialogs, alerts, and charts.
- Integrations for stores and platform credentials.
- Events and raw payload inspection.
- Notifications and alerts.
- Settings, organizations, stores, and team management.
- Backend sync jobs for products, orders, and returns.
- Platform connectors, OAuth flows, webhooks, encrypted credentials, Supabase repositories, Redis/BullMQ queues.

## Reengineering Goal

Create a spec-driven roadmap that cleans up the existing app without losing product behavior. The first priority is backend reliability and performance: sync engine, connector boundaries, durable webhooks, credential safety, data-access efficiency, and then frontend domain cleanup.

## Success Criteria

- Future implementation work starts from `client/AGENTS.md`, a feature-spec, and a concrete plan.
- Generated/vendor code is clearly marked as protected/non-authoritative.
- Backend reengineering preserves current routes, queues, tables, and UI behavior unless a plan explicitly approves a migration.
- Each domain has a feature-spec with current state, target state, acceptance criteria, and verification.
- Progress and decisions remain resumable across sessions.
