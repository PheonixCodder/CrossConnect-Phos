# UI Context

## Design Direction

CrossConnect is a dense operational SaaS dashboard. The UI should feel work-focused, scannable, and reliable rather than promotional. Favor tables, filters, status indicators, compact cards, dialogs, and predictable navigation.

## Existing System

- Next.js App Router with React client views for dashboard-heavy screens.
- Tailwind CSS v4 with CSS variables in `frontend/app/globals.css`.
- shadcn/new-york configuration in `frontend/components.json`.
- Radix UI primitives and lucide icons.
- Outfit font from `next/font/google`.
- Dark mode defaults to enabled.

## Tokens

- Font: Outfit for primary UI text.
- Radius: `--radius: 0.5rem`; keep cards and controls compact.
- Primary: green/teal OKLCH token from `globals.css`.
- Neutral background/card/border/input tokens from `globals.css`.
- Platform colors:
  - Amazon: orange.
  - Warehance: teal.
  - Walmart: blue.
  - Target: red.
  - Faire: yellow.
  - Shopify: green.
- Status colors:
  - Success: green.
  - Warning: amber.
  - Error: red.

## Layout Rules

- Dashboard pages use side navigation plus constrained content containers.
- Tables should support scanning, filtering, and row-level dialogs.
- Cards are for repeated items, metrics, and status summaries, not decorative nesting.
- Avoid hero/marketing layouts inside the app.
- Keep copy concise and operational.
- Use icon buttons where familiar, with tooltips when the icon is not obvious.

## Feature UI Ownership

- Dashboard: metrics, channel cards, inventory/orders/products/returns tables, charts, alerts.
- Integrations: platform cards, store lists, credential dialogs, store create/rename/delete.
- Events: event table, filters, payload viewer.
- Notifications: alert table and alert details.
- Settings/team: organizations, stores, profile, members, team invites.

## Reengineering Direction

Preserve the current visual language while making modules easier to reason about. Prefer domain hooks and view models over binding screens directly to raw Supabase table shapes.
