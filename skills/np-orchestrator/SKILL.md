---
name: np-orchestrator
description: Build a feature end-to-end with the np-skills workflow — brainstorm, grill, write a plan, optionally review the plan, implement under TDD, then code-review and design-review. Use when the user says "I want to build X", "ship this feature", or describes new functionality that warrants a plan. Honors short-circuit phrases like "skip grilling", "review the plan", "use the team", and "no figma".
---

# np-orchestrator

You are routing a feature build through the np-skills chain. Do not implement directly — invoke the sub-skills. Each link in the chain is its own skill so the user can stop, inspect artifacts, and resume.

## The chain

```
brainstorm? → grill → write-plan → review-plan? → implement (TDD) → code-review → design-review?
 if team mode: build-with-team takes over from write-plan onward
```

`?` = conditional. `grill` is the default front-door — it always produces or updates the spec file at `docs/plans/<ts>-<slug>-spec.md`, so there's always a document before the plan.

**The scenario thread:** behavior is captured once as Gherkin scenarios and reused at every link. `grill` authors them in the spec (the user reviews and extends them there) → `write-plan` copies them verbatim into the plan's `## Scenarios` section and links each task to scenario IDs → `tdd` copies each scenario's Given/When/Then into an acceptance test. The user only reviews behavior once, in domain language, before any code exists.

**When to also run `brainstorm` first:** only when the user's idea is genuinely exploratory ("I want to do *something* about onboarding, not sure what"). Brainstorm diverges through possible designs and picks one; grill then converges on the details. For concrete asks ("add Stripe webhook retries"), skip brainstorm — grill alone is the right tool and will write the spec itself.

## Reading the user's intent

Before invoking anything, parse the user's request for **mode flags** (prose, not options):

| Phrase | Effect |
|---|---|
| "skip brainstorm", "no brainstorm", "I know what I want" | Skip `brainstorm` (it's already off by default — only on for exploratory asks) |
| "skip grilling", "skip grill", "no grilling" | Skip `grill`. Risky: this means jumping straight to `write-plan` from a raw user statement. Warn the user once, then honor it. |
| "review the plan", "let's review the plan", "review together" | Run `review-plan` after `write-plan` |
| "use the team", "with team", "as a team", "parallel" | Hand off to `build-with-team` after the plan exists |
| "no figma", "backend only", "no UI" | Skip `implement-figma` and `design-review` |
| "no tests" | Refuse. TDD is mandatory; explain and continue with `tdd` |

If the user provided a Figma URL, treat it as implicit UI work — do **not** skip `implement-figma` or `design-review`.

## Step-by-step

### 1. Brainstorm (default: OFF — only on for exploratory asks)

Only invoke `brainstorm` when the user's ask is genuinely fuzzy ("something about onboarding", "improve the dashboard somehow"). It explores possible designs and picks one. For concrete asks ("add X", "fix Y", "build Z component"), skip directly to grill — it'll produce the spec itself.

If brainstorm runs, it writes `docs/plans/<ts>-<slug>-spec.md` and waits for the user to approve before grill takes over.

### 2. Grill (default: ON)

Invoke `grill`. If a spec file exists from brainstorm, it loads that and stress-tests. If not, it starts from the user's statement and writes the spec inline as decisions resolve. By the time grill returns, `docs/plans/<ts>-<slug>-spec.md` exists and is complete.

### 3. Write the plan (always)

Invoke `write-plan`. It writes `docs/plans/<ts>-<slug>.md` with the 5-step TDD task template and no-placeholder rule. The timestamp is `YYYY-MM-DDTHHMMSS` so plans don't collide across branches.

### 4. Review the plan (default: off)

Only if the user asked. Invoke `review-plan`, which walks the plan with the user and edits in place.

### 5. Implement

Implementation follows the **GOOS double loop** (see `tdd/GOOS.md`): each scenario is an outer acceptance-test loop that stays red while inner unit cycles drive the design out, going green when the feature is whole. For a new feature surface, the plan's first task is a **walking skeleton** — a thin end-to-end slice through the real architecture — before any feature behavior.

Two modes:

- **Inline (default)** — work through the plan yourself, one task at a time, invoking `tdd` for every step that touches code and `implement-figma` for any step that touches UI from a Figma source.
- **Team mode** — invoke `build-with-team`. It spawns a TeamCreate team with the default roles (backend-dev, frontend-dev, code-reviewer, tester, design-reviewer) and hands them the plan path. You become the conductor; teammates execute.

### 6. Code review (always, after implementation)

Invoke `code-review`. It dispatches a reviewer subagent with the plan as the source of truth.

### 7. Design review (only when there was UI work)

Invoke `design-review`. It uses Playwright to capture the implementation and diffs against the Figma screenshot taken during `implement-figma`.

## What you must not do

- Do not write production code from inside this skill. Delegate to `tdd`.
- Do not skip `write-plan`. Even tiny features get a plan file — it's the audit trail.
- Do not skip `code-review`. The user can ignore the findings, but the pass must happen.
- Do not invent a timestamp slug. Generate it with `date -u +%Y-%m-%dT%H%M%S` so it's UTC and sortable.

## ADRs

`grill`, `review-plan`, and `code-review` each watch for ADR candidates and offer to invoke the `adr` skill. You don't drive ADR creation directly — the sub-skills do. But you should be aware: ADRs live at `docs/adr/NNNN-slug.md` and are referenced from the spec and plan headers (`**ADRs:**` field).

## Status updates to the user

After each step completes, give one line: which skill ran, what artifact it produced (with path), and what's next. Brief is good. The artifacts speak for themselves.
