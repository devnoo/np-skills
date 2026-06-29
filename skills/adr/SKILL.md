---
name: adr
description: Capture an Architecture Decision Record for a hard-to-reverse choice made during grill, plan, or implementation. Use when a decision is (a) hard to reverse, (b) surprising without context, and (c) the result of a real trade-off — not for routine choices. Writes docs/adr/NNNN-slug.md. Adapted from mattpocock/skills grill-with-docs ADR pattern.
---

# adr

An Architecture Decision Record documents a choice that future readers will need to *understand the reasoning behind*, not just see in the code.

## The three-test rule

Only create an ADR when **all three** are true:

1. **Hard to reverse** — changing this later requires migration, breaking API changes, or significant refactoring.
2. **Surprising without context** — a competent engineer reading the code six months from now would say "wait, why did they do *that*?"
3. **Result of a real trade-off** — there was an actual alternative that was rejected for stated reasons. If "we used the obvious default", that's not an ADR.

If any test fails, don't write an ADR. Mention the decision in the spec's *Constraints & decisions made* section instead.

## Examples that qualify

- "We chose at-least-once delivery over exactly-once because the dedup layer is cheaper than two-phase commit." (Reversal = re-architecting the event bus.)
- "We model addresses as a single free-form string instead of structured fields." (Reversal = data migration; surprising in 2026.)
- "We picked Drizzle over Prisma because we need raw SQL escape hatches for the analytics queries." (Reversal = ORM swap.)

## Examples that do NOT qualify

- "We used Zod for validation." (Routine; no real alternative considered.)
- "We named the table `users` instead of `user`." (Easy to rename.)
- "We added a feature flag." (Standard pattern; not surprising.)

## Where it lives

```
docs/adr/NNNN-slug.md
```

- `NNNN` is the next sequential number, zero-padded to 4 digits. Find the highest existing number under `docs/adr/` and add 1. If the directory is empty, start at `0001`.
- `slug` is kebab-case, derived from the decision title.
- Create `docs/adr/` if it doesn't exist.

## The format

See `ADR-FORMAT.md` in this skill directory. The skeleton:

```markdown
# ADR NNNN: <Decision title — imperative, short>

**Date:** YYYY-MM-DD
**Status:** proposed | accepted | superseded by ADR NNNN
**Context for:** <plan or spec path, if this came out of a specific build>

## Context
<1–3 sentences. What problem are we solving, and what constraints exist?>

## Decision
<1–3 sentences. The choice, stated clearly. Imperative tense: "We will use X.">

## Alternatives considered
- **<Alt 1>** — why we didn't pick it.
- **<Alt 2>** — why we didn't pick it.

## Consequences
- **Good:** <what this enables>
- **Bad:** <what this costs or constrains>
- **Risk:** <what could go wrong>
```

Keep it short. ADRs that take a page to read don't get read. If you can't fit each section in 3 sentences, the decision probably wasn't crisp enough.

## How to invoke this skill

`grill`, `review-plan`, and `code-review` can call this when they spot a qualifying decision. The flow:

1. The calling skill says: "This looks like an ADR candidate. The decision is: <X>. Want me to write an ADR?"
2. Apply the three-test rule explicitly — if any test fails, skip and note in the spec instead.
3. If all three pass: write `docs/adr/NNNN-slug.md` and reference it from the spec/plan that prompted it (`See ADR 0007.`).
4. Status: start with `proposed`. Flip to `accepted` once the implementing PR merges.

## What this skill does NOT do

- Does not log routine decisions. The spec's *Constraints & decisions made* section catches those.
- Does not write retrospective ADRs for choices made years ago (unless the user explicitly asks).
- Does not supersede an existing ADR silently — if a new decision overrides an old one, set the old one's status to `superseded by ADR NNNN` and link both.
