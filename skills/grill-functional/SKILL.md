---
name: grill-functional
description: Run a refinement session on WHAT to build — first the features as bullets, then "what if…?" scenarios the user did not think of, including error cases — until it is clear what is going to be built, and write the short spec. Use when the user wants to stress-test a feature idea, says "grill me", "functional grill", "refine this", or after brainstorm; the default front door for a new feature. Purely functional: technical design is grill-technical, which runs next. Adapted from mattpocock/skills grill-me + grill-with-docs.
---

# grill-functional

A refinement session. The user says what they want; you play the team that asks "yes, but what if…?" until it is clear what is going to be built.

```
1. FEATURES            2. WHAT IF…?              3. DONE
"what are we building,  per feature: scenarios    clear what is
 what does it do?"      the user did not think of going to be built
 → bullets F1, F2…      → scenarios S1, S2…       → grill-technical
```

**Purely functional.** No modules, tables, interfaces or call order. A technical point that comes up goes under *Technical questions* in the spec, unanswered, for `grill-technical`.

## Concise, always

The user does not read long text. This outranks completeness of wording, never completeness of scenarios.

- **A turn is one table plus at most three lines.** No intro, no recap, no explanation of what you are about to ask.
- **A what-if row is one line per cell.** If the outcome needs a second sentence, it is two rows.
- **A feature bullet is one line.** A scenario is three lines: Given, When, Then.
- **The spec has no prose sections.** Bullets, tables, scenarios. Nothing is written twice.
- **Cut before you send.** Reread the turn and delete every sentence the user could answer without.

## 1. Features

Ask only this: **"What is the feature we are building? What does it do?"**

Turn the answer into bullets, one feature each, in the user's words, ID'd `F1`, `F2`, …. Show them and ask "is this the list?". Nothing else happens until the list is confirmed.

```markdown
- **F1** A person can cancel a run from the Runs page.
- **F2** Every held run says why it is held.
```

- One line per feature. A feature that needs "and" is two features.
- Don't ask about users, edge cases or scope yet. That is step 2.
- A term used loosely ("the queue", "blocked") gets pinned now — see *Words*.

## 2. What if…?

Take one feature at a time. **You come up with the scenarios**; the user confirms or corrects. Play the refinement: "the user pushes this button, but then fills in this field — then that happens, right?"

For each feature, show a batch of at most five what-ifs, each with the outcome you assume:

```markdown
**F1 — cancel a run**

| # | What if… | Then (my guess) |
| --- | --- | --- |
| S1 | the run is on a box when it is cancelled | it shows Stopping until the box confirms |
| S2 | the box never confirms | after 5 minutes it is Cancelled anyway |
| S3 | it finishes at the same moment it is cancelled | one wins; the run ends once, not twice |
```

The user answers `ok`, or names the row that is wrong. Fix it, then the next batch or the next feature.

- **Hunt for what the user did not think of.** The happy path is the least useful row. For every feature walk: wrong or missing input · nothing there (empty) · too much (limits) · it fails halfway · it happens twice · two things at once · the wrong person does it · someone changes their mind (undo, cancel) · the thing it depends on is gone.
- **Guess, don't interrogate.** Always propose the outcome. Check the code or the existing product for how it behaves today before guessing. A guess the user corrects is faster than an open question.
- **A real choice gets its own question.** When you cannot guess — two outcomes are both reasonable and they differ for the user — ask that one alone, in chat, with your recommendation first and one line per alternative. One such question per turn.
- **Domain language only.** No class, table or function names, no HTTP verbs. If a stakeholder who cannot code could not read the row, rewrite it.
- **A what-if can add a feature.** If an answer reveals one, add it as the next `F<n>` and say so.
- **Out of scope is an answer.** "We don't handle that" goes in *Out of scope*, with the what-if that raised it.

## 3. Done

Stop when it is clear what is going to be built:

- every feature has its what-ifs answered, including at least one error case;
- no row is still a guess the user has not seen;
- you could tell, for any situation, what the product does;
- the user can say what is being built without a fuzzy word.

Then ask: "Spec at `<path>`. Anything else on behavior before the technical grill (`grill-technical`)?"

## The spec

Write it as you go, to `docs/specs/<ts>-<slug>.md` (`date -u +%Y-%m-%dT%H%M%S`; use `docs/plans/` only if the repo has no `docs/specs/`). Create it once the feature list is confirmed; update it after every answer.

```markdown
# Spec: <name>

## Features
- **F1** …

## Scenarios
### F1 — <feature>
Scenario: S1 — <short name>
  Given <a state>
  When <an event>
  Then <the outcome>

## Out of scope
## Decisions
## Technical questions (for grill-technical)
```

- **Scenarios are the contract.** Each confirmed what-if row becomes one Gherkin scenario — one transition each, `S<n>` kept from the table. `write-plan`, `to-issues` and `tdd` read them from here by ID.
- **Short.** Bullets, tables and scenarios. No paragraph longer than two lines, no section that restates another. A spec the user will not read end to end protects nothing.
- **No design.** No Architecture or How section; `grill-technical` adds `## How` later.

## Words

When the user uses a term loosely, ask which precise thing they mean, pick one word, and use it everywhere after. If the project keeps a glossary (`CONTEXT.md`, or per module via `CONTEXT-MAP.md`), check new terms against it and write resolved ones into it right away, in the format of [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md). If what the user says contradicts how the product works today, say so and ask which is right.

## Not this skill

- Not brainstorm: that explores which thing to build. This refines the thing already chosen.
- Not technical design: that is `grill-technical`.
- Not a questionnaire: you bring the scenarios, the user corrects them.
