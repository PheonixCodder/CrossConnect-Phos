# Feature Spec: Dashboard

## Current State

The dashboard displays store/channel cards, metrics, sales chart, alerts, inventory, products, orders, returns, and detail dialogs. Some UI paths consume raw Supabase generated table rows directly, which couples visual components to database schema details.

## Target State

Preserve the dense operational dashboard while moving screen logic toward domain hooks and view models. Components should receive dashboard-oriented models, not raw table rows, unless they are intentionally schema-facing.

## Requirements

- Preserve current route and visual behavior.
- Keep dark-default operational design.
- Keep date range and active store behavior stable.
- Define dashboard view models for metrics, channel cards, table rows, and dialog details.
- Keep Supabase generated types inside data hooks/adapters as much as practical.

## Acceptance Criteria

- Dashboard remains visually consistent.
- Data hooks own query/transform logic.
- Components become easier to test and reuse.
- Raw Supabase table shapes do not spread further into presentational components.

## Verification

- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- Add focused hook/component tests when view-model logic becomes non-trivial.
