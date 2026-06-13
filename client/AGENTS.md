# CrossConnect Context Rules

Read these files before implementation or architectural decisions:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/ui-context.md`
4. `context/code-standards.md`
5. `context/ai-workflow-rules.md`
6. `context/progress-tracker.md`
7. Relevant `context/feature-specs/*.md`
8. Relevant `plans/reengineering/*.md`
9. `plans/002-decisions-log.md`

This project is an existing app. Do not treat this scaffold as permission to rewrite code freely. Reengineering work must be spec-driven, incremental, and compatible with current routes, queues, tables, and UI behavior unless a feature-spec explicitly approves a migration.

Authoritative sources:

- User-approved requirements in this `client/` scaffold.
- Reviewed source code in `backend/` and `frontend/`.
- `graphify-out/GRAPH_REPORT.md` and `graphify query` for architecture orientation.
- Generated types only as schema references, not as design guidance.

Before changing code:

- Read the relevant feature-spec and reengineering plan.
- Identify protected/generated folders from `context/code-standards.md`.
- Keep app code changes scoped to the active build unit.
- Preserve existing behavior unless the plan says otherwise.

After meaningful implementation:

- Update `context/progress-tracker.md`.
- Update `plans/002-decisions-log.md` for decisions affecting architecture, product scope, data model, security, deployment, or workflow.
- Update the relevant context or feature-spec if implementation changes the intended design.
- Run the verification commands required by the active plan.

Never use placeholder context as truth. If context and source code disagree, inspect the source, then update context or ask the user before implementing.
