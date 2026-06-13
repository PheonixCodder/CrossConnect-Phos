# Feature Spec: Settings And Team

## Current State

Settings and team modules cover organizations, stores, profile, members, and team member UI. The exact authorization model should be reviewed before changing access behavior. Generated Supabase types are available, but UI should not become more tightly coupled to raw schema rows.

## Target State

Settings and team should remain stable while backend reliability work proceeds. Later cleanup should clarify organization membership, store ownership, and access boundaries through domain models.

## Requirements

- Preserve current routes and UI.
- Do not change authorization behavior without a dedicated plan.
- Keep organization/store management aligned with integration behavior.
- Use domain-facing models for settings/team screens where transformations are needed.
- Log access-control decisions before implementation.

## Acceptance Criteria

- Existing settings/team flows remain compatible.
- Future auth/access decisions are logged before implementation.
- UI components avoid additional direct coupling to raw generated table shapes.

## Verification

- `cd frontend && npm run lint`
- `cd frontend && npm run build`
