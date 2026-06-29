---
name: design-it-twice
description: Generate two opposing designs in parallel via sub-agents with deliberately conflicting mandates, then compare on leverage, locality, and seam placement before picking. Use during brainstorm, grill, or improve-architecture whenever a shape-defining design choice has two defensible answers. Adapted from mattpocock/skills improve-codebase-architecture INTERFACE-DESIGN.md.
---

# design-it-twice

When a design choice is non-obvious, generate **two** designs in parallel from sub-agents with deliberately opposing mandates. Compare on three axes, then synthesize. Often the right answer is neither — it's the hybrid that surfaces only after seeing both.

## When to invoke

- A `brainstorm` decision where two approaches are both defensible and you can name a real trade-off.
- An `improve-architecture` candidate where the right shape isn't obvious.
- A `grill` question where the user is leaning one way but the alternative deserves a serious look.

**Don't invoke** for routine choices (naming, library selection between equivalents, file paths). Reserve for shape-defining decisions — interface design, where a seam goes, how strict to be about input.

## How

Dispatch **two** sub-agents via the `Agent` tool, in parallel (single message, two tool calls). Each gets:

- The problem statement (verbatim, no leading).
- Their opposing mandate (see pairs below).
- A request to return: (a) the proposed interface, (b) one concrete usage example, (c) one limitation they accept as the cost of their mandate.

### Common mandate pairs

| Pair | Use when |
|---|---|
| **Minimalism vs Flexibility** | New abstraction; unsure how much to expose. Minimal agent: smallest surface that solves today. Flexible agent: surface that handles likely future needs. |
| **Common-case vs Adapter** | Adding a hook into existing code; one big API or many small adapters. Common-case agent: one path that covers 80%. Adapter agent: small core, callers wrap. |
| **Strict vs Permissive** | Validation / parsing. Strict agent: reject early, narrow types. Permissive agent: accept and normalize. |
| **In-place vs Adjacent** | Refactoring existing code. In-place agent: evolve the current module. Adjacent agent: build alongside, migrate, delete the old. |

Pick the pair that fits the decision. Don't invent a third mandate — two is the discipline.

## Compare on three axes

When both sub-agents return, score each design 1–3 per axis:

1. **Leverage** — how much downstream code benefits from this design? Which unlocks more future work?
2. **Locality** — does this design keep related changes together, or scatter them across the codebase?
3. **Seam placement** — does the design's interface fall at a natural boundary in the system?

Present a comparison table:

```
| Axis           | Design A (Minimalism) | Design B (Flexibility) |
|----------------|-----------------------|------------------------|
| Leverage       | 2                     | 3                      |
| Locality       | 3                     | 2                      |
| Seam placement | 3                     | 2                      |
| Total          | 8                     | 7                      |
```

Show the table to the user with a one-sentence recommendation and the synthesis (below).

## Synthesize

Often the right answer is **neither** of the two designs — it's a hybrid that takes the best of each. The fan-out's value is surfacing what each *gets right* so the synthesis is informed. Articulate the synthesis explicitly: "Take the minimal interface from A, but keep the adapter slot from B."

If the synthesis is genuinely worse than picking one outright, say so and pick.

## Output

Write the comparison and synthesis to whatever artifact prompted the invocation:

- From `brainstorm` → append to the spec under a "Designs considered" subsection.
- From `improve-architecture` → embed in the refactor survey candidate.
- From `grill` → log in *Constraints & decisions made* of the spec.
- Standalone → `docs/plans/<ISO-ts>-design-comparison-<slug>.md`.

If the chosen design qualifies under the ADR three-test rule (hard-to-reverse + surprising + real trade-off), invoke the `adr` skill to capture it.

## What this skill does NOT do

- Does not run **three or more** designs in parallel. Two is the cap — more becomes noise, not signal.
- Does not invoke itself recursively from inside a sub-agent.
- Does not commit to a winning design without user confirmation.
- Does not run for routine decisions — reserve for shape-defining ones.
