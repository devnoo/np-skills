---
name: write-plan
description: Translate an approved spec into a concrete, executable implementation plan with TDD-shaped tasks. Use when a spec has been brainstormed or when the user has requirements ready for a multi-step task and is about to touch code. Produces docs/plans/<ISO-timestamp>-<slug>.md. Adapted from obra/superpowers writing-plans.
---

# write-plan

Produce a single plan file that another engineer (or agent) can execute without re-asking the user anything. The plan is the contract.

## Where it lives

```
docs/plans/<ISO-timestamp>-<slug>.md
```

- Generate the timestamp with `date -u +%Y-%m-%dT%H%M%S` (UTC, sortable, no `:` so it's filesystem-safe).
- Slug is kebab-case, derived from the feature name (e.g. `2026-05-20T143012-stripe-webhook-retry.md`).
- The time component is the merge-conflict shield: two plans on the same day across branches won't collide.
- Create `docs/plans/` if it doesn't exist.

## Required structure

See `PLAN-FORMAT.md` in this skill directory for the canonical template. The skeleton:

```markdown
# <Feature Name> Implementation Plan

> Agentic worker: this plan is intended to be executed task-by-task, each task under `tdd`. If executing in team mode, see `build-with-team`.

**Goal:** <one sentence — observable outcome>
**Tech Stack:** <from the project — link `docs/codemap/STACK.md` or the relevant subset sniffed from manifests; never hand-invented>
**Spec:** <path to spec file if one exists>
**ADRs:** <links to any ADRs that govern this work, or "none">

## Architecture

<short — 1 paragraph or a few bullets. Which modules/files this touches, which existing abstractions it leans on, what new boundaries it introduces, where to look in the codebase. If the spec already has an Architecture section, this can summarize and link; don't duplicate. Reference ADRs by number for any hard-to-reverse choices.>

## Scenarios

<Gherkin Given/When/Then blocks, one per behavior, each with an ID (S1, S2, …), in domain language. Copied from the spec — see PLAN-FORMAT.md for the format and rules.>

## Tasks

### Task 1: <short imperative>

**Implements:** <scenario IDs annotated opens/advances/completes, e.g. "S1 (opens + completes), S2 (advances)" — or "none (infrastructure)">

**Files:**
- Create: `<path>` (lines: N/A — new file)
- Modify: `<path>` (around line ~123)
- Test: `<path>` (Create)

**Steps:**
- [ ] 1. (If this task **opens** a scenario) Write its failing acceptance test in the acceptance suite — copy the Given/When/Then in as Arrange/Act/Assert, tagged `[S1]`. It stays red until the scenario is **completed** (here or a later task). Then write the next failing **unit** test for the slice this task builds.
- [ ] 2. Run `<command>`; verify the new unit test fails for the right reason (not a syntax error)
- [ ] 3. Implement minimally in `<path>` — <specific code>
- [ ] 4. Run `<command>`; verify the unit suite is green. (If this task **completes** the scenario, its `[S1]` acceptance test now goes green too; otherwise it stays intentionally red.)
- [ ] 5. Commit: `<imperative commit message>`

### Task 2: ...
```

## Task rules

- Each task is sized to **2–5 minutes** of focused work. If bigger, split it.
- Every code-touching task uses the **5-step TDD template** above. No exceptions.
- **Derive the stack from the project, never invent it.** Load `docs/codemap/STACK.md` if it exists and link it (don't restate the whole thing — just the part this plan touches). If there's no codemap, sniff `package.json`/lockfiles/manifests. If you genuinely can't determine the stack from the project, that's a gap to resolve before writing the plan — don't guess a framework.
- **`Files:` is mandatory** — list every file the task creates, modifies, or tests, with exact paths and approximate line ranges for modifications. If `docs/codemap/STRUCTURE.md` exists, validate file paths against it before writing the plan — flag anything that doesn't match the documented structure.
- **Steps must embed actual code where applicable.** "Add a function `parseWebhook`" is wrong. Show the signature, the body shape, the imports. If `docs/codemap/CONVENTIONS.md` exists, seed naming and patterns from it (and warn if it's stale: `last_commit` ≠ current HEAD).
- **Slice each task as a tracer bullet, ordered outside-in (GOOS).** A **tracer bullet** is a thin vertical slice fired all the way through the real architecture — never a horizontal layer (all the models, then all the controllers) built in isolation. The first tracer bullet is the **walking skeleton**: for a new feature surface (new service, endpoint family, or screen flow), **Task 1** is the thinnest end-to-end slice that runs through the real pipeline and makes one trivial scenario pass — proving the wiring before any real behavior leans on it. Then fire the next tracer bullet at each scenario: the top-level behavior first, then its collaborators. For changes to an already-skeletoned system (e.g. adding a field), skip the skeleton — the pipeline already exists. See `tdd/GOOS.md`.
- **Order tasks by dependency.** Task N+1 may assume artifacts from Task N exist. Outside-in ordering and dependency ordering usually agree; when they conflict, dependency wins (you can't test against an interface that doesn't compile).
- **Lint scenarios against the action catalog (if present).** If `docs/codemap/actions/` exists, run `node <this-skill-dir>/check-scenarios.mjs <plan-path>` after writing the plan. It's advisory — it flags steps matching no catalogued action (drift, or a new action to add) and actions no scenario uses. Resolve real drift by aligning phrasing to the catalog or appending the new action (back through `grill`); don't rewrite the plan to silence it.
- **Copy scenarios from the spec; don't invent them.** The `## Scenarios` section is the behavior contract `grill` already authored and the user reviewed. Paste them in verbatim (IDs and all). If the spec has no Scenarios section, stop — that's a gap. Send it back to `grill` rather than writing scenarios yourself; the user must have reviewed them.
- **Every scenario must be claimed, opened once, completed once.** Each `S<n>` appears in at least one task's `**Implements:**`, with exactly one task that `opens` it (writes the failing acceptance test) and exactly one that `completes` it (turns it green). Small scenarios do both in one task; larger ones span tasks that `advance` it while it stays red. An unclaimed scenario is untested behavior; an opened-but-never-completed scenario is a feature that never finishes. See `PLAN-FORMAT.md`.

## The No-Placeholders rule

Forbidden phrases in any plan you write:

- `TBD`
- `figure out later`
- `implement appropriately`
- `add error handling` (without saying *what* error handling)
- `similar to Task N` (without spelling it out)
- `etc.` in a step list (be exhaustive)
- `<...>` placeholders that aren't filled in

If you can't resolve a placeholder, go back to `grill` and resolve it. Plans with placeholders are not finished plans.

## After writing

1. Do a self-review pass:
   - Does every task have a failing-test step?
   - Are file paths real (exist or about-to-be-created)?
   - Does the dependency order hold?
   - Is each scenario sliced as a tracer bullet — vertical, end-to-end through the real architecture — rather than a horizontal layer?
   - Any placeholder phrases?
   - Is every scenario (`S1`…`Sn`) claimed by at least one task's `**Implements:**`?
   - Did the scenarios come from the (user-reviewed) spec, not from you?
   - If an action catalog exists, did `check-scenarios.mjs` come back clean (or are the remaining misses genuinely new actions you appended)?
2. Show the user the plan path.
3. Ask: "Plan written to `<path>`. Run `review-plan` together, or proceed to implementation?"

## Handoff

- For inline execution: hand the plan path to whoever runs `tdd` per task.
- For team execution: hand the plan path to `build-with-team`.
