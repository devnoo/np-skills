---
name: brainstorm
description: Diverge through possible designs for a fuzzy idea, then converge on one to spec out. Use ONLY when the user's ask is exploratory ("something about onboarding", "improve the dashboard somehow") — for concrete asks, skip this and use grill directly. Produces a spec file the user must approve before grill takes over. Adapted from obra/superpowers brainstorming.
---

# brainstorm

This skill is for **exploratory** asks only. If the user already knows what they want to build (concrete feature, specific bug, named component), skip to `grill` — it will produce the spec itself. Brainstorm exists for the case where the design space is still open and you need to diverge before converging.

No implementation, no scaffolding, no code edits until the user has approved a spec.

## How to elicit

- Ask **one question at a time**. Never batch.
- Prefer multiple-choice when the answer space is bounded; use `AskUserQuestion` so the user picks from concrete options.
- For each question, state your **recommended answer** and one sentence on why.
- If a question can be answered by reading the codebase, read the codebase instead — don't make the user spell out what's already in their repo.
- Sharpen vague terms inline. If the user says "the dashboard," ask "do you mean `apps/web/dashboard/` or something new?"
- When the user contradicts an earlier answer, surface the contradiction explicitly and ask them to resolve.

## What to elicit

Walk the decision tree from top to bottom:

1. **Goal** — what observable outcome marks this "done"?
2. **Users** — who triggers this, and from where?
3. **Inputs / outputs** — exact shapes, not vibes.
4. **Edge cases & failure modes** — empty state, error state, partial data, concurrent writes.
5. **Out of scope** — what are we explicitly *not* doing in this round?
6. **Constraints** — existing code, deadlines, tech stack lock-ins, perf budgets.

You can propose 2–3 approaches with trade-offs once enough of the tree is resolved, and let the user pick. Recommend one. If two approaches are both defensible on shape-defining axes (interface scope, seam placement, strictness), invoke `design-it-twice` to fan out and compare them rigorously instead of eyeballing.

## The artifact

When all branches are resolved, write the spec to:

```
docs/plans/<ISO-timestamp>-<slug>-spec.md
```

Generate the timestamp with `date -u +%Y-%m-%dT%H%M%S`. Slug is kebab-case, derived from the feature name.

### Spec structure

```markdown
# <Feature Name> — Spec

**Date:** <ISO-timestamp>
**Status:** draft / approved

## Goal
<one paragraph>

## Users & triggers
<bullets>

## Inputs / outputs
<shapes, examples>

## Behavior
<numbered list of what happens, including edge cases>

## Architecture
<short — 1 paragraph or a few bullets. How this fits the existing system: which modules/files it touches, which existing abstractions it leans on, what new boundaries (if any) it introduces. NOT a full design doc; just enough that a reader can locate the change in the codebase. Link to ADRs (`See ADR 0007.`) for any hard-to-reverse architectural choices.>

## Scenarios
<Gherkin Given/When/Then scenarios (S1, S2, …) in domain language — the behavior contract. Brainstorm may seed a few obvious ones, but this section is `grill`'s job to complete and the user reviews them there. Leave a stub if the design is still fluid.>

## Out of scope
<bullets>

## Constraints & decisions made
<bullets — record the choices made during this brainstorm so future-you knows why. For decisions that pass the ADR three-test rule (hard-to-reverse + surprising + real trade-off), invoke the `adr` skill instead of inlining the reasoning here, and link the ADR.>

## Open questions
<bullets — anything intentionally deferred>
```

## Self-review before handing off

Before announcing the spec is ready, scan it for:

- **Placeholders** — "TBD", "TODO", "figure out later" → resolve or move to Open questions.
- **Internal consistency** — does Behavior cover every case in Inputs/outputs?
- **Scope** — is anything in Behavior actually out-of-scope creep?
- **Ambiguity** — any phrase another engineer could misread?

Fix what you find, then ask the user to approve.

## Approval gate

Show the user the spec path and ask: "Approve this spec, or do you want to revise?" Do not invoke `grill`, `write-plan`, or anything downstream until they say yes.

## What this skill does NOT do

- It does not write a plan. That's `write-plan`'s job.
- It does not ask "what tests do you want?" — testing is mandatory and decided in the plan.
- It does not touch code.
