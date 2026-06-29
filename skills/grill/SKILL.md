---
name: grill
description: Interview the user relentlessly about a spec or plan until reaching shared understanding, resolving each branch of the decision tree one decision at a time. Use when the user wants to stress-test a plan, says "grill me", or after brainstorm before write-plan. Adapted from mattpocock/skills grill-me + grill-with-docs.
---

# grill

Interview the user relentlessly about every aspect of this spec or plan until you reach shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one-by-one.

## Rules

1. **Ask the questions one at a time.** Never batch.
2. **For each question, provide your recommended answer** with a one-line reason. Use `AskUserQuestion` and put your recommendation first with `(Recommended)` in the label.
3. **If a question can be answered by exploring the codebase, explore the codebase instead.** Don't ask the user what's already in their repo.
4. **Load codemap docs if present.** If `docs/codemap/ARCHITECTURE.md` exists, read it before grilling — many architectural questions are pre-answered there. Also load `CONVENTIONS.md` or `TESTING.md` when the user's question touches those areas. If a loaded doc's `last_commit` frontmatter ≠ current `HEAD`, warn the user "codemap is N commits stale, treating with caution" but proceed.
4. **Challenge fuzzy language.** If the user uses a term loosely ("cancellation", "user", "the dashboard"), ask which precise thing they mean before proceeding.
5. **Cross-reference existing decisions.** If a new answer contradicts something resolved earlier, surface the conflict and ask them to choose.
6. **Don't let the user off the hook.** "We'll figure that out later" is only acceptable if the decision can be safely deferred without blocking other decisions. Otherwise, push.

## What to grill on

Walk the dependency tree of decisions. Typical branches:

- **Data shape** — exact field names, types, nullability, defaults.
- **Behavior on edge** — empty state, max state, error state, race conditions, partial data, retries.
- **Boundaries** — what's this code's responsibility vs. what's the caller's?
- **Failure modes** — what happens if the network/db/external service is down? What does the user see?
- **Reversibility** — if this ships and is wrong, how hard is it to roll back or change?
- **Out of scope** — explicitly name what this work won't do, so the user can correct you.
- **Scenarios** — once a branch's behavior is settled, pin it as a Gherkin scenario (see below). Scenarios are where grilling *lands*: a resolved decision you can't express as a Given/When/Then isn't resolved enough.

When a decision opens new sub-decisions, descend into them before climbing back up.

## Scenarios (the behavior contract)

As decisions resolve, capture each settled behavior as a **Gherkin scenario** in the spec's `## Scenarios` section. This is the artifact `write-plan` copies into the plan and `tdd` copies into tests — so the user reviews behavior *here*, in their language, before any code exists.

Format — one state transition per scenario (GIVEN a state, WHEN an event, THEN the next state; Uncle Bob's "Pickled State"):

```gherkin
Scenario: <short name>
  Given <a state, in domain terms>
  When <an event>
  Then <the resulting state / observable outcome>
```

ID each one `S1`, `S2`, … as you write it. The strict keywords are just a notation for being unambiguous — they don't commit the project to Cucumber or any Gherkin tooling; `tdd` later copies the Given/When/Then into a plain test.

**Rules while authoring:**

1. **Domain language only — no implementation leakage.** This is the rule that matters most.
   - ❌ `Given the UserService has an empty userRepository`
   - ✅ `Given no registered users`
   - If a stakeholder who can't code couldn't read the scenario, rewrite it. Strip class/table/function names, HTTP verbs, and field types.
2. **One transition per scenario.** Two `When`s usually means two scenarios.
3. **Coverage sweep before stopping.** Walk all four passes explicitly and name gaps — Uncle Bob's recurring failure is "the scenarios were incomplete":
   - happy path
   - edge / boundary (empty, max, partial)
   - error / failure (and security, if relevant)
   - cross-cutting (auth, concurrency, idempotency)

**The user reviews and extends them.** After you draft scenarios for a branch, show them and ask: "Here are the scenarios for X — anything to add, change, or split?" When the user says "grill me on the scenarios" or "add a scenario for Y", treat that as a first-class grilling target: probe the missing transition, draft the new `S<n>`, and add it to the spec. Extensions the user requests are not scope creep — they're the contract getting sharper.

**Compose from the action catalog (if the project uses one).** When `docs/codemap/actions/<module>.md` exists, build scenarios from the actions already catalogued there — reuse the exact phrasing so steps stay a controlled vocabulary, not free text. When a scenario needs an action that isn't catalogued yet, **append it** to the right module's catalog (one line under Given/When/Then) as you write the scenario. This is the "add new ones" path: the catalog grows with the scenarios. It's advisory — if the project has no catalog, just write the Gherkin directly. See `codemap` for the format.

For shape-defining decisions where the user is leaning one way but the alternative deserves a serious look, invoke `design-it-twice` to fan out two opposing designs in parallel and compare them on leverage, locality, and seam placement.

## When to stop

You stop when:

- Every open branch has either a concrete decision or an explicit "deferred — does not block".
- The user can describe what they're building without using any ambiguous terms.
- You can predict, for any input scenario, what the implementation should do.
- **Every settled behavior is captured as a Gherkin scenario**, the suite passes the four-pass coverage sweep, and the user has reviewed them.
- The spec file is complete (no placeholders, every section filled, except possibly Open questions for explicitly-deferred items).

When you stop, show the user the spec path and ask: "Spec at `<path>`. Anything else to challenge before we write the plan?"

## The spec artifact

Grill always produces or updates a spec file. There are two cases:

**Spec already exists** (e.g. brainstorm ran first): the file is at `docs/plans/<ts>-<slug>-spec.md`. Update it inline as decisions resolve — don't batch. Each resolved branch is a single edit.

**No spec exists yet**: create one at `docs/plans/<ts>-<slug>-spec.md` after the first 1–2 questions, once you have a feature name. Use the same structure brainstorm uses (Goal / Users & triggers / Inputs & outputs / Behavior / **Architecture** / **Scenarios** / Out of scope / Constraints / Open questions). Fill sections as decisions get resolved. The spec is grill's audit trail — by the time you finish, it should be complete enough for `write-plan` to act on.

**Scenarios section:** the Gherkin behavior contract described above. This is the section `write-plan` copies into the plan verbatim — so it must be complete and user-reviewed before grill ends. Every behavior named in the *Behavior* prose should have at least one corresponding `S<n>` scenario.

**Architecture section:** as decisions resolve, sketch a short Architecture paragraph in the spec — which modules/files this touches, which existing abstractions it leans on, what new boundaries it introduces. Not a full design doc; just enough that a reader can locate the change in the codebase.

**ADR offer:** when a decision passes the three-test rule (hard-to-reverse AND surprising-without-context AND result of a real trade-off), pause and ask the user: "This looks like an ADR candidate — should I invoke the `adr` skill to capture it?" If yes, hand off to `adr`. If no, log it in *Constraints & decisions made*. Don't write ADRs reflexively — most decisions don't qualify.

If the project has a glossary (`CONTEXT.md` at root, or per-module via `CONTEXT-MAP.md`), check terms against it and call out conflicts immediately ("Your glossary defines `cancellation` as X, but you seem to mean Y here").

## What grill is not

- Not a re-do of brainstorm. Brainstorm explores the design space; grill stress-tests a chosen design.
- Not a code review. You're challenging decisions, not implementations.
- Not a status meeting. Every question must reduce ambiguity.
