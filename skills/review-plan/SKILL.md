---
name: review-plan
description: Walk a written plan with the user, surface risks and gaps, and edit the plan in place. Use after write-plan when the user asks to "review the plan", "review together", or before handing off to implementation. Optional step — only run when explicitly requested.
---

# review-plan

A collaborative pass over a finished plan. The goal is to catch issues *before* implementation starts — bad task ordering, missed edge cases, wrong file paths, hand-wavy steps.

## Inputs

- The plan path (`docs/plans/<ts>-<slug>.md`).
- The spec path if one exists.
- Your read of the codebase to validate file paths and existing patterns.

## Process

### 1. Read the whole plan first

Don't comment until you've read it end-to-end. Make notes on:

- Tasks that depend on something later (out-of-order).
- File paths that don't match the codebase.
- Steps that say *what* but not *how*.
- Missing test coverage for behavior in the spec.
- Missing edge cases (empty state, error state, concurrency).
- Steps that combine multiple commits.
- Anything that looks like a 30-minute task hiding as a 5-minute task.

### 2. Walk the plan with the user, task by task

For each task:

1. Quote the task title.
2. Surface concerns you found (state the issue, your recommended fix, and ask).
3. Use `AskUserQuestion` for binary decisions ("split this task or keep it merged?").
4. **Edit the plan in place** as decisions resolve — don't batch edits to the end.
5. Move on only when the task is clean.

### 3. Cross-task review

After every task is individually clean, scan the plan for cross-cutting issues:

- **Dependency order** — does Task N+1 reference files that exist after Task N?
- **Outside-in (GOOS)** — for a new feature surface, is Task 1 a walking skeleton (thin end-to-end slice through the real architecture)? Do tasks work inward from each scenario rather than bottom-up? See `tdd/GOOS.md`.
- **Scenario coverage** — does every scenario (`S1`…`Sn`) in the `## Scenarios` section appear in at least one task's `**Implements:**`? Are the scenarios still in domain language (no implementation leakage), and do they pass the four-pass sweep (happy / edge / error / cross-cutting)? A missing pass is a gap to send back to `grill`, not something to invent here.
- **Test coverage** — does at least one task assert each behavior named in the spec?
- **Commit hygiene** — does each commit message stand alone?
- **Rollback** — if implementation stops halfway, does the repo still build?
- **Architecture section sanity** — does the plan's Architecture section accurately describe what the tasks build? If tasks drifted from the spec's architecture, surface it.
- **ADR candidates** — any decision encoded in the tasks that passes the three-test rule (hard-to-reverse + surprising + real trade-off) but isn't captured as an ADR? Offer to invoke the `adr` skill.

### 4. Finalize

Update the plan's status field (or add one if missing): `**Status:** reviewed YYYY-MM-DD`. Show the user the diff summary and ask: "Plan looks clean. Start implementation?"

## What this skill does NOT do

- Does not rewrite the plan from scratch. If it needs that, go back to `write-plan`.
- Does not approve test strategy on the user's behalf — push back if test coverage is thin.
- Does not touch code. Reviewing the plan is the entire job.
