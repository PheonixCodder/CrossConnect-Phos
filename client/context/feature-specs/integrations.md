# Feature Spec: Integrations

## Current State

Integrations include platform overview, store list, add/rename/delete store flows, and credential dialogs. Backend connector/OAuth behavior is inconsistent across platforms, and UI platform metadata can drift from backend support.

## Target State

Integrations should provide a predictable store connection and credential management flow backed by typed platform capability metadata and credential schemas.

## Requirements

- Preserve current integrations route and UI.
- Represent platform capabilities consistently.
- Avoid exposing secret fields in frontend state beyond submission.
- Align UI platform list with backend supported platforms.
- Map credential dialogs to backend credential schema names and required fields.
- Disable or clearly handle unsupported platform/domain actions.

## Acceptance Criteria

- Platform cards and store list remain compatible.
- Credential dialogs map to documented backend credential schemas.
- UI platform capabilities match backend capability metadata.
- Secret values are not displayed after submission unless explicitly intended.

## Verification

- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- Backend credential tests when backend schemas are implemented.
