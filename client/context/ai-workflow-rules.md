# AI Workflow Rules

## Required Context Flow

Before implementation:

1. Read `client/AGENTS.md`.
2. Read the relevant `context/feature-specs/*.md`.
3. Read the relevant `plans/reengineering/*.md`.
4. Inspect current source before editing.
5. State the intended edit scope.

After implementation:

1. Run the verification commands from the active plan.
2. Update `context/progress-tracker.md`.
3. Update `plans/002-decisions-log.md` for meaningful decisions.
4. Update feature-spec/context files if implementation changes the intended design.
5. Refresh Graphify with `graphify update .` after code changes when practical.

## Planning Rules

- Every reengineering unit needs a plan and a feature-spec before code changes.
- Plans should be implementation-ready and decision complete.
- Feature-specs describe current state, target state, constraints, acceptance criteria, and verification.
- If implementation reveals the plan is wrong, update the plan before continuing.

## Source Control Rules

- The worktree may be dirty. Do not revert user changes.
- Keep generated/vendor files protected unless the task explicitly targets them.
- Avoid broad refactors outside the active unit.
- Do not run rewriting formatters unless the active task intends formatting changes.

## Graphify Rules

- Use `graphify query`, `graphify path`, or `graphify explain` for orientation when `graphify-out/graph.json` exists.
- `.graphifyignore` excludes generated/noise files to keep the graph focused on app code.
- `graphify-out/` is useful context but not implementation truth when source code disagrees.

## Default Reengineering Mode

- Backend first.
- Domain feature-specs.
- Incremental compatibility.
- Pragmatic tests plus build/lint/analyze checks.
