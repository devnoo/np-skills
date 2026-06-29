---
name: build-with-team
description: Spawn a parallel agent team to execute a plan, with default roles for backend-dev (TS+Vitest+TDD), frontend-dev (Figma+Playwright), code-reviewer, tester, and design-reviewer. Use when the user says "use the team", "with team", "as a team", or "parallel", and a plan file already exists under docs/plans/. Uses TeamCreate for persistent named teammates.
---

# build-with-team

You are the conductor. The team executes; you coordinate.

## Preconditions

- A plan file exists under `docs/plans/<ts>-<slug>.md`. If not, refuse and route the user to `write-plan` first.
- The user explicitly asked for team mode. Default execution is inline.

## The default team

Five teammates, defined as briefs in `roles/` (this skill directory):

| Role | Brief | Responsibility |
|---|---|---|
| `backend-dev` | `roles/backend-dev.md` | TypeScript backend tasks. Uses `tdd` for every change. |
| `frontend-dev` | `roles/frontend-dev.md` | Frontend tasks. Uses `implement-figma` for any Figma-tied work, `tdd` for logic. |
| `code-reviewer` | `roles/code-reviewer.md` | Runs `code-review` after each task and before merge. |
| `tester` | `roles/tester.md` | Designs test cases at unit / integration / E2E levels; pairs with devs during RED. |
| `design-reviewer` | `roles/design-reviewer.md` | Runs `design-review` after each frontend task with a Figma source. |

The user can override composition by saying things like "no frontend-dev, I'll do the UI myself" or "add a security-reviewer".

## Setup

1. Use `TeamCreate` to spawn the team. Name the team `np-<plan-slug>` so it's identifiable.
2. For each role, pass the role brief as the initial system prompt and the plan path as context.
3. Confirm to the user: "Team `<name>` spawned with roles: <list>. Plan: <path>. Ready to start."

## Conducting

Use `TaskCreate` to materialize the plan's tasks as team tasks. Carry each task's `**Implements:**` scenario IDs onto the team task so the owner knows which scenarios they must make pass. For each task:

- Assign owner based on file paths:
  - Backend file (`src/server/`, `apps/api/`, etc.) → `backend-dev`.
  - Frontend file (`src/web/`, `apps/web/`, `components/`) → `frontend-dev`.
  - Mixed → split into sub-tasks per role.
- Block `code-reviewer` tasks behind their corresponding implementation tasks (via `addBlockedBy`).
- Block `design-reviewer` tasks behind frontend tasks that have a Figma source.
- `tester` collaborates during RED for each task (it doesn't own its own tasks; it advises the dev whose task it is). It owns scenario coverage: each scenario gets an `[S<n>]` acceptance test when it's `opened`, and that test must be green by the time its `completing` task lands. A scenario red mid-feature is expected.

Use `SendMessage` to brief teammates on context that didn't fit in the plan.

Use `Monitor` to watch team progress without polling — `TaskUpdate` notifications fire as work completes.

## Coordination rules

- **One task at a time per teammate.** Parallelism is across roles, not within a role.
- **Code-review runs after every dev task, before the next one starts.** Even in parallel, the dependency graph guarantees this per task.
- **Design-review runs after every frontend-dev task with a Figma source.** Loop until only Minor findings remain.
- **If a teammate is blocked** (missing decision, ambiguous step), they ask you via `SendMessage`. You decide or escalate to the user.

## Teardown

When all plan tasks are completed:

1. Run a final `code-review` on the full diff.
2. Run a final `design-review` if there was any UI work.
3. Summarize to the user: tasks completed, findings resolved, findings deferred, plan path, branch state.
4. Use `TeamDelete` to dismiss the team unless the user asks to keep it for follow-up work.

## What this skill does NOT do

- Does not skip `code-review` or `design-review` to go faster.
- Does not let a teammate violate `tdd`. If a teammate ships code without a failing test first, that task is rejected and restarted.
- Does not let a scenario's `completing` task close with its `[S<n>]` acceptance test still red. (Earlier `advancing` tasks legitimately leave it red — only the completer must green it.)
- Does not invent roles. The defaults are the defaults; new roles need an explicit brief from the user.
