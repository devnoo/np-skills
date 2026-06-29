---
name: improve-architecture
description: Proactively walk the codebase to find architectural friction, then propose ranked deepening opportunities — refactors that turn shallow modules (large interface, small implementation) into deep ones. Use when the user says "improve architecture", "find refactoring opportunities", "deepen this module", "find shallow modules", or asks for a periodic refactor survey. Produces a Markdown survey under docs/plans/<ts>-refactor-survey.md. Adapted from mattpocock/skills improve-codebase-architecture.
---

# improve-architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

## Vocabulary — use these exact terms

Never drift into "component", "service", "API", or "boundary". They mean something everywhere and nothing here. Restate in this vocabulary:

| Term | Meaning |
|---|---|
| **Module** | A unit of code with a defined interface. Can be a file, directory, class, function. |
| **Interface** | The surface another module must understand to use this one. **Smaller is better.** |
| **Implementation** | The code behind the interface. Larger is fine — depth comes from hiding complexity. |
| **Depth** | A property of the **interface, not the implementation**. A deep module's interface is much smaller than its implementation. |
| **Seam** | A natural boundary where one module talks to another. Tests live at seams. |
| **Adapter** | Code that translates between a module's interface and another's. |
| **Leverage** | How much downstream code benefits from a single change at this point. |

If you catch yourself reaching for a banned term, stop and restate in the vocabulary above.

## Three-phase process

### 1. Explore

- If `docs/codemap/ARCHITECTURE.md` exists, read it.
- Read every ADR under `docs/adr/`. Past decisions constrain proposals — don't propose a deepening that contradicts an accepted ADR without explicitly flagging the conflict.
- Walk the code looking for these signals:

| Signal | What it suggests |
|---|---|
| Module exports 10+ functions, each ≤5 lines | Shallow — candidate to deepen |
| Two modules import the same internal helpers and have similar shapes | Possibly mergeable |
| Same translation logic appears at 2+ call sites | **Two-adapter rule** — real seam, extract |
| Tests assert internal calls between modules | Seam is in the wrong place |
| Module's exported types leak implementation details (e.g. ORM rows, framework objects) | Interface bleeds — encapsulate |
| Frequent ripple changes (touching N files for one logical change) | Module split along the wrong axis |

### 2. Report

Write a Markdown survey to `docs/plans/<ISO-timestamp>-refactor-survey.md` (use `date -u +%Y-%m-%dT%H%M%S`).

```markdown
# Refactor survey — <date>

## Candidate 1: <short name>

**Current shape:** <one sentence>
**Proposed shape:** <one sentence>
**Why:** <leverage / depth gain / seam improvement, in the vocabulary>
**Risk:** <what could break, how reversible>
**Effort:** small | medium | large
**Conflicts with ADRs:** <list, or "none">

\`\`\`mermaid
graph TD
  <before diagram — current module shape>
\`\`\`

\`\`\`mermaid
graph TD
  <after diagram — proposed shape>
\`\`\`

## Candidate 2: ...
```

**Ranking:** order candidates by `leverage × (1 / risk)`. Highest leverage / lowest risk on top. Use Mermaid for diagrams — it renders in GitHub Markdown and Claude Code, no HTML toolchain needed.

### 3. Grill the chosen candidate

Once the user picks a candidate, hand off to `grill` to design the refactor in detail. Two patterns to invoke during grill:

- **`design-it-twice`** — when the proposed shape has a non-obvious design choice, spawn parallel sub-agents with opposing mandates and synthesize.
- **`adr`** — when the refactor commits to a hard-to-reverse choice, capture it. **Also capture rejections as ADRs** ("we considered deepening X and chose not to because Y") so the next survey doesn't re-propose the same candidate.

Then `write-plan` → `tdd` executes the refactor.

## Deepening rules

- **One adapter is a hypothetical seam. Two adapters means a real one.** Extract a seam only when you can name two existing translation sites — not when you imagine a future one.
- **Depth lives in the interface, not the implementation.** A module with a 200-line implementation behind a 3-function interface is deep. A module with a 50-line implementation behind a 15-function interface is shallow. Lines of implementation are not the metric.
- **Replace tests at the new interface, don't keep both layers.** When you deepen, the old unit tests at the old interface are obsolete — write new ones at the new interface and delete the old.
- **Don't merge modules that don't share a real seam.** Similar shapes don't imply a common abstraction. If they talk to different downstream code, leave them apart.
- **Refactor under TDD.** Every refactor task goes through `tdd`. RED first (a test that pins the *current* observable behavior), then the refactor, then GREEN.

## What this skill does NOT do

- Does not execute the refactor. It surveys and ranks. The user picks; `grill` → `write-plan` → `tdd` executes.
- Does not propose changes that contradict accepted ADRs without flagging the conflict.
- Does not optimize for line count. Depth is the metric, not size.
- Does not run automatically. This is a periodic survey, invoked on demand — not a commit hook.
