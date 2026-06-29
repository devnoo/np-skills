# Plan format

Canonical structure for any file under `docs/plans/<ISO-timestamp>-<slug>.md` (excluding `-spec.md` files, which are brainstorm output).

## Header

```markdown
# <Feature Name> Implementation Plan

> **Agentic worker:** execute this plan task-by-task, each task under `tdd`. For parallel execution, see `build-with-team`.

**Goal:** <one sentence — observable outcome that marks "done">
**Tech Stack:** <derived from the project, not invented — link `docs/codemap/STACK.md` if it exists, else the subset sniffed from `package.json`/lockfiles/manifests that this plan actually touches>
**Spec:** <path to spec file, or "none">
**Figma:** <Figma URL with fileKey+nodeId, or "none">
**ADRs:** <links to ADRs that govern this work (e.g. `docs/adr/0007-at-least-once-delivery.md`), or "none">

## Architecture

<short — 1 paragraph or a few bullets. Which modules/files this touches, which existing
abstractions it leans on, what new boundaries it introduces, where to look in the
codebase. If the spec already has an Architecture section, this can summarize and
link; don't duplicate. Reference ADRs by number for any hard-to-reverse choices.>
```

## Scenarios section

The behavior contract. Every scenario is a Gherkin block specifying one state transition
(GIVEN a state, WHEN an event, THEN the next state — per Uncle Bob's "Pickled State").
A complete suite covers the happy path, edges, errors, and cross-cutting concerns.

The keywords are a **notation, not a runtime requirement** — there is no Cucumber or
`.feature` step-definition engine behind them. `tdd` lowers each scenario into a plain
test in the project's existing runner (the keywords become a comment). Use strict
keywords purely so the behavior is unambiguous and copies cleanly into a test.

**These are copied verbatim from the spec** if `grill` authored them. write-plan does not
invent scenarios from scratch — if the spec has none, that's a gap to send back to grill.

````markdown
## Scenarios

### S1: <short scenario name — domain language>
```gherkin
Scenario: <short scenario name>
  Given <a state, in domain terms>
  When <an event>
  Then <the resulting state / observable outcome>
  And <additional outcome, if any>
```

### S2: <next scenario>
```gherkin
Scenario: ...
```
````

**Rules for scenarios:**

- **ID every scenario** `S1`, `S2`, … — tasks reference them by ID.
- **Domain language only — no implementation leakage.** The single most important rule.
  - ❌ `Given the UserService has an empty userRepository`
  - ✅ `Given no registered users`
  - A scenario a non-programmer stakeholder couldn't read is wrong. Strip class names, table
    names, function names, HTTP verbs, and field-level types out of Given/When/Then.
- **One transition per scenario.** If you need two `When`s, it's probably two scenarios.
- **Coverage sweep** — before finalizing, confirm the suite spans: happy path, edge/boundary
  (empty, max, partial), error/failure, and any cross-cutting concern (auth, concurrency).
  Uncle Bob's recurring failure mode is "the scenarios were incomplete" — name the gaps.

## Body

````markdown
## Tasks

### Task 1: <short imperative — e.g. "Add Webhook schema with discriminated union">

**Implements:** S1 (opens + completes), S3 (advances) <!-- scenario IDs this task works on. Annotate each: "opens" = writes the failing acceptance test, "advances" = builds toward it (stays red), "completes" = turns it green. A scenario small enough for one task is "opens + completes". "none (infrastructure)" if it touches no scenario. -->

**Files:**
- Create: `src/webhooks/schema.ts`
- Test: `src/webhooks/schema.test.ts` (Create)

**Steps:**
- [ ] 1. Write failing acceptance test in `src/webhooks/schema.test.ts` — copy scenario **S1**'s Given/When/Then in as the Arrange/Act/Assert (the two are isomorphic), tagged with the ID:
  ```ts
  import { describe, it, expect } from "vitest";
  import { WebhookSchema } from "./schema";
  describe("WebhookSchema", () => {
    // S1: Given an unknown event type, When parsed, Then it is rejected
    it("[S1] rejects unknown event types", () => {
      expect(() => WebhookSchema.parse({ type: "nope" })).toThrow();
    });
  });
  ```
- [ ] 2. Run `pnpm vitest run src/webhooks/schema.test.ts`; verify failure is "Cannot find module './schema'" (not a syntax error in the test).
- [ ] 3. Implement minimally in `src/webhooks/schema.ts`:
  ```ts
  import { z } from "zod";
  export const WebhookSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("invoice.paid"), id: z.string() }),
    z.object({ type: z.literal("invoice.failed"), id: z.string(), reason: z.string() }),
  ]);
  ```
- [ ] 4. Run `pnpm vitest run`; verify the new test passes and prior tests still pass.
- [ ] 5. Commit: `feat(webhooks): add Webhook discriminated-union schema`.

### Task 2: ...
````

## Mandatory fields per task

- **`### Task N:`** title in imperative mood.
- **`**Implements:**`** — the scenario IDs (`S1`, `S2`, …) this task works on, each annotated `opens` / `advances` / `completes` (see below), or `none (infrastructure)` for tasks that touch no scenario. Every scenario in the `## Scenarios` section must be claimed by at least one task, **opened by exactly one and completed by exactly one** — an unclaimed scenario is an untested behavior; an opened-but-never-completed scenario is a feature that never finishes.
- **`**Files:**`** — every path the task touches, labeled `Create`, `Modify`, or `Test`. For modifications, include approximate line numbers when the file is large.
- **`**Steps:**`** — exactly the 5-step TDD template for any task that changes runtime code:
  1. Write failing test
  2. Run and verify red (for the right reason)
  3. Implement minimally
  4. Run and verify green (and no regressions)
  5. Commit

## Scenarios that span multiple tasks (outside-in / GOOS)

A scenario is the **outer acceptance-test loop**. Small scenarios fit one task (`opens + completes`). Larger ones span several:

- The **opening** task's step 1 writes the failing acceptance test (in the acceptance suite, tagged so its red is intentional). It stays red.
- **Advancing** tasks build collaborators inward with their own unit tests; the acceptance test is still red — that's expected, not a regression. Their step 4 verifies the *unit* suite, and notes the acceptance test remains red.
- The **completing** task's final step turns the acceptance test green — that's the proof the scenario is done.

Order these tasks so the opener comes first and the completer last. See `tdd/SKILL.md` ("The double loop") for how to keep the red acceptance test from blocking per-task commits.

## Tasks that are not code changes

For pure config / docs / asset tasks, use a 3-step template:
1. Make the change
2. Verify it (lint, build, visual check, etc.)
3. Commit

These are the exception. Default to 5-step TDD.

## Forbidden phrases

- `TBD`, `TODO`, `figure out later`
- `implement appropriately`, `add error handling` (without specifics)
- `similar to Task N`
- `etc.` in step lists
- Any `<...>` placeholder that isn't filled in by the time the plan is handed off
