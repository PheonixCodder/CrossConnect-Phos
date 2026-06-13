# Plan 006: Frontend Domain Cleanup

## Summary

Clean frontend feature boundaries after backend contracts stabilize, preserving the existing dashboard design. The goal is lower coupling to raw generated Supabase table shapes and clearer domain view models.

## Key Changes

- Keep current routes and visual language.
- Move screen-specific transforms into domain hooks/view models.
- Reduce direct raw `frontend/types/supabase.types.ts` usage in presentational components.
- Keep tables, dialogs, filters, date ranges, active store behavior, and side navigation compatible.
- Align integrations UI with backend platform capability metadata.
- Add event/notification redaction/status display once backend durable webhook states exist.

## Test Plan

- Run `cd frontend && npm run lint`.
- Run `cd frontend && npm run build`.
- Add focused hook/component tests when view-model logic becomes non-trivial.
- Smoke-check dashboard, integrations, events, notifications, settings, and team routes after cleanup.

## Assumptions

- No visual redesign is part of this unit.
- Backend API/data behavior is stable before broad frontend cleanup.
- Generated Supabase types remain schema references, not UI model definitions.
