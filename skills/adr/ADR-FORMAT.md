# ADR format

Canonical structure for any file under `docs/adr/NNNN-slug.md`.

## Template

```markdown
# ADR NNNN: <Decision title — imperative, under 60 characters>

**Date:** YYYY-MM-DD
**Status:** proposed | accepted | superseded by ADR NNNN | deprecated
**Context for:** <docs/plans/<ts>-<slug>.md, or "general architecture">

## Context

<1–3 sentences. What problem are we solving? What constraints exist that
narrow the design space?>

## Decision

<1–3 sentences, imperative tense. "We will use X." Not "We are considering X.">

## Alternatives considered

- **<Alternative 1 name>** — <one line: why rejected>.
- **<Alternative 2 name>** — <one line: why rejected>.

(At least two alternatives. If you can't name one, this wasn't a real trade-off
and probably doesn't warrant an ADR.)

## Consequences

- **Good:** <what this unlocks or makes easier>
- **Bad:** <what this costs, complicates, or forecloses>
- **Risk:** <what could go wrong; what would tell us we picked wrong>
```

## Rules

- **Imperative tense in Decision.** "We will adopt at-least-once delivery." Not "We are thinking about adopting..."
- **Status starts at `proposed`.** Flip to `accepted` when the PR implementing it merges. Use `superseded by ADR NNNN` (and link back from the new one) when a later decision overrides this. Use `deprecated` if the decision no longer applies but isn't replaced.
- **Date is the day the decision is recorded**, not the day work started.
- **No code blocks longer than 5 lines.** ADRs are about reasoning, not implementation. Long code goes in the codebase or the plan.
- **Link, don't duplicate.** Reference the spec, the plan, and any related ADRs. Don't restate them.

## Numbering

- Sequential, zero-padded to 4 digits (`0001`, `0002`, …, `0042`).
- Never renumber. If an ADR is rejected before merge, leave its slot empty or mark its status `deprecated` — do not shift other numbers.
- Slug is kebab-case from the decision title (`0007-at-least-once-delivery.md`).
