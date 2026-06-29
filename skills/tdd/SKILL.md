---
name: tdd
description: Enforce strict red-green-refactor for every code change. Use when implementing any feature or bugfix, before writing any implementation code. Adapted from obra/superpowers test-driven-development. Defaults to Vitest for unit/integration and Playwright for E2E.
---

# tdd

## The Iron Law

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**

This is non-negotiable. If you find yourself writing implementation before a test, stop, delete what you wrote, and start over. Pre-existing untested code that you're "adapting" must be deleted, not preserved as a reference.

## The double loop (outside-in, GOOS)

This skill follows *Growing Object-Oriented Software, Guided by Tests* (Freeman & Pryce). Work in **two nested loops**:

```
OUTER (acceptance):  write a failing scenario test  ─────────────┐
                                                                  │
   INNER (unit):  RED → VERIFY RED → GREEN → VERIFY GREEN → REFACTOR   (repeat many times)
                                                                  │
OUTER:  scenario goes green when the feature is whole  ←──────────┘
```

- The **outer loop** is one scenario from the plan (`[S<n>]` acceptance test — plain or Cucumber). You **write it first**, watch it fail for the right reason, and it **stays red across however many subtasks the feature takes** — it is the to-do marker that says "the feature isn't done yet." It turns green only once, when the last subtask lands.
- The **inner loop** is the ordinary unit cycle below. You run many inner cycles — discovering objects and their collaborators — and each one ends on a **green unit suite**. The outer test stays red the whole time; that's expected, not a violation.
- **Start from the outside.** Write the acceptance test you wish you could read, watch it fail, then drive inward with units. Don't build bottom-up and hope it composes.

**The red acceptance test must not block per-task work.** A committed-failing acceptance test would otherwise trip "all tests green before commit." Keep the two streams separate:

- Run acceptance tests as their own command/suite (`test:acceptance`, Cucumber, or a `*.acceptance.test.ts` glob), distinct from the unit run.
- The **per-task green rule applies to the unit suite.** The in-progress feature's acceptance test is allowed to be red until the feature completes — mark it so its red is intentional, not mistaken for a regression (a `test.fails`/`@wip` tag, a tracked skip with the scenario ID, or a feature branch where a red acceptance run is expected).
- CI gates on the unit suite per commit; the acceptance suite is expected red mid-feature and must be green before the feature merges.

Full detail — walking skeleton, mocking roles to discover interfaces, listening to the tests — is in `GOOS.md` (this skill directory). Read it before starting a new feature surface.

## The cycle (the inner loop)

```
RED → VERIFY RED → GREEN → VERIFY GREEN → REFACTOR → repeat
```

### 1. RED — write one failing test

- Write a **single** test that asserts the next slice of behavior.
- **When a task opens a new scenario** (its `**Implements:**` names an `S<n>` no earlier task has started), write that scenario's **acceptance test first** — copy the Given/When/Then in as Arrange/Act/Assert, tag it with the ID (`it("[S1] …")`), and put it in the acceptance suite. It fails now and stays red until the scenario is fully built (this task, or a later one if the scenario spans subtasks). Don't re-author it in subsequent tasks — it already exists, still red. See "Scenarios → tests" below.
- The rest of the cycle in this task drives **unit** tests inward toward making that acceptance test pass.
- Minimal: one assertion if possible, two if the setup makes a second cheap.
- The test must fail because the production code doesn't do the thing yet — not because of a typo, missing import, or syntax error.

### 2. VERIFY RED — actually run it

- Run the test. Read the failure.
- The failure must be **for the right reason**: "expected X, got Y" or "function not implemented", not "Cannot find module" caused by a typo.
- If the failure is wrong, fix it before continuing. Do not move to GREEN with a broken RED.

### 3. GREEN — write the minimum code to pass

- Write the **smallest** change that makes the test pass.
- Resist the urge to add error handling, edge cases, or "while I'm here" improvements. Those are future tests.
- It's allowed (and often correct) for the code to look ugly at this stage.

### 4. VERIFY GREEN — run the full suite

- Run the new test: must pass.
- Run the **full unit suite**: must still pass.
- The **in-progress scenario's acceptance test is expected to still be red** until the feature is whole — that's not a regression. Acceptance tests that were *already green* must stay green. When the inner cycle that completes the feature turns the acceptance test green, that's the signal the scenario is done.
- Output must be **pristine** — no unexplained warnings, no leaked console.log, no flakes. If there's noise, fix it before continuing.

### 5. REFACTOR — clean up without changing behavior

- With a green bar, restructure for clarity.
- Rule: no new behavior. Every refactor leaves the test suite green; if it doesn't, you weren't refactoring, you were re-implementing.

### Repeat

One cycle = one small behavior shipped. The plan's task steps should already be sized for one cycle each.

## Red flags — STOP and start over

If any of these happen, stop, discard the work, and restart the cycle:

- You wrote production code before a test.
- A test passed the moment you wrote it (it was never red).
- You said "I'll keep this code as reference" while writing a test around it.
- You said "I already manually tested it, the unit test is just for coverage".
- You're writing a test that asserts the implementation's internals (mocks, private methods) instead of observable behavior.
- You're writing more than one test before any of them is green.

**Listen to the tests (GOOS).** A test that's hard to write is design feedback, not an obstacle. Awkward setup → too many dependencies. Lots of mocks → the object is doing too much, or you're mocking the wrong seam. Can't assert without reaching into internals → the behavior wants to live somewhere else. When a test fights you, fix the *design*, don't contort the test.

See `ANTI-PATTERNS.md` (in this skill directory) for the longer list, especially the section on mocks. For mocking **roles to discover interfaces** (the positive GOOS technique — mock the collaborator you wish existed to drive its interface out), see `GOOS.md`.

## Scenarios → tests

The plan's `## Scenarios` section holds Gherkin scenarios authored in `grill` and reviewed by the user. Each is one state transition, and **Given/When/Then is isomorphic to Arrange/Act/Assert** (Uncle Bob, "Pickled State") — so a scenario copies into a test with no translation:

```
Given <state>   →   Arrange the system into that state
When  <event>   →   Act: perform the event
Then  <outcome> →   Assert the outcome
```

**You do not need a Gherkin runtime.** The strict `Scenario:/Given/When/Then` keywords are an *authoring notation* in the plan, not an executable format you must wire up. There is no Cucumber, no `.feature` files, and no step definitions unless the project already uses them. The scenario text lowers into an ordinary test in the project's existing runner — the keywords survive as a comment, the body is plain Vitest/Playwright. This mirrors how Uncle Bob and the DAE reference work: Gherkin is the spec, plain tests are what run.

**Tooling sniff (do this once per project):**

- **Default — no Gherkin tooling:** copy the scenario into a normal test (the pattern below). Nothing to install.
- **Project already has Cucumber** (`@cucumber/cucumber`, `cucumber-js`, a `features/` dir, or `*.feature` files): match it. See `CUCUMBER.md` in this skill directory for the feature-file layout, `@S<n>` tagging, step-definition reuse, and the red/green mapping.
- **Project wants to adopt Cucumber fresh** (the user asks, or the plan calls for executable `.feature` files): `CUCUMBER.md` has the one-time setup scaffold. Don't install it unprompted — adopting Cucumber is a project decision, not a default.

Mechanics (default, no Gherkin tooling):

- For each scenario a task `**Implements:**`, the first RED test is an **acceptance test** named with the ID and carrying the Given/When/Then as a comment:
  ```ts
  // S2: Given a logged-out visitor, When they submit valid credentials, Then they land on the welcome page
  it("[S2] sends a valid login to the welcome page", () => {
    // Arrange: logged-out visitor
    // Act: submit valid credentials
    // Assert: welcome page
  });
  ```
- Keep the assertion in **domain terms**, matching the scenario. The acceptance test verifies the observable transition; deeper **unit tests** pin down internals the scenario doesn't mention.
- **The acceptance test is written once and stays red** while the inner unit cycles build toward it — across this task and any later subtasks the same scenario spans. It goes green exactly once, when the scenario is fully implemented.
- **Don't paraphrase the scenario into something weaker.** If the scenario says "Then the user sees the welcome page," the test asserts that — not "Then `render()` was called."
- **One action → one step implementation, reused.** If the project keeps action catalogs (`docs/codemap/actions/<module>.md`), each catalogued Given/When/Then action maps to a single reusable helper — a step function in plain tests, or a Cucumber step def. Implement an action once; every scenario that uses it shares that implementation. Record the mapping in the catalog's optional "Implemented by" section. This is what makes the catalog pay off: the controlled vocabulary becomes a small, deduplicated layer of step code. The domain-language rule matters here too — a leaky action becomes leaky shared step code.
- A scenario is done when its `[S<n>]` acceptance test goes green. A *task* is done when its unit suite is green and any scenario it was the **last** subtask for is green; tasks that only move a multi-task scenario forward leave it red (intentionally). If implementing reveals a missing or wrong scenario, stop and send it back to `grill` for the user to review — don't silently invent behavior in the test.

## Defaults

Unless the project says otherwise:

- **Unit / integration:** Vitest (`pnpm vitest run <path>`).
- **E2E:** Playwright (`pnpm exec playwright test`).
- **Test file location:** colocated (`foo.ts` ↔ `foo.test.ts`), unless the project already follows another convention (then match the project).

Sniff the project for existing test runner config (`vitest.config.*`, `jest.config.*`, `playwright.config.*`) before picking. Match what's there.

## Verification checklist (must pass before declaring a task done)

- [ ] Every behavior in the task has a test asserting it.
- [ ] Each scenario this task opened has an acceptance test that was written first and went red for the right reason.
- [ ] Any scenario this task *completes* is now green; scenarios still mid-build are intentionally red in the acceptance suite (not mistaken for regressions).
- [ ] Every test was red before it was green.
- [ ] `pnpm vitest run` (or project equivalent) — the unit suite — is clean.
- [ ] No accidental skipped/`.only` tests; the only red/skipped tests are in-progress acceptance tests, tagged as such.
- [ ] No leaked debug output.
- [ ] Commit message describes the behavior, not the test mechanics.
