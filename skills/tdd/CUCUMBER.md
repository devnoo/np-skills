# Running scenarios through real Cucumber

The plan's `## Scenarios` section is already valid Gherkin in domain language. With Cucumber, the same scenarios become **executable** `.feature` files and the implementation work is writing **step definitions** instead of inline Arrange/Act/Assert. Nothing upstream changes — `grill` and `write-plan` need no modification.

Use this path only when the project already has Cucumber, or the user explicitly opts in. The default lowering (plain test with the Given/When/Then as a comment) is in `SKILL.md`.

## Where things live

```
features/
  <slug>.feature          # the scenarios, copied verbatim from the plan
  steps/
    <slug>.steps.ts       # step definitions (reused across scenarios)
  support/
    world.ts              # shared test context ("World"), hooks
cucumber.cjs              # or cucumber.json — config
```

Match the project's existing layout if one exists; only impose this when scaffolding fresh.

## Traceability: the `@S<n>` tag

The plan references scenarios by ID (`**Implements:** S1, S3`). Cucumber has no native ID, so carry the ID as a **tag** on each scenario. The feature block is otherwise a verbatim copy of the plan's Gherkin:

```gherkin
Feature: Webhook ingestion

  @S1
  Scenario: unknown event type is rejected
    Given an unknown event type
    When the webhook is received
    Then it is rejected
```

`@S1` lets you run one scenario (`cucumber-js --tags @S1`) and lets `code-review` / `tester` trace a passing scenario back to the task that claimed it.

## Implementation = step definitions (and they're reused)

This is the real difference from the plain-test lowering. A step is written **once** and reused by every scenario that says the same phrase. That is exactly why the domain-language rule matters more here:

```ts
// features/steps/webhooks.steps.ts
import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "vitest";          // or chai/node:assert — match the project
import { parseWebhook } from "../../src/webhooks/parse";

Given("an unknown event type", function () {
  this.payload = { type: "nope" };
});

When("the webhook is received", function () {
  this.act = () => parseWebhook(this.payload);
});

Then("it is rejected", function () {
  expect(this.act).toThrow();
});
```

- **Steps share state via the World** (`this`), not module globals — keeps scenarios isolated.
- **A leaky step is worse here than in a plain test.** `Given the UserService has an empty userRepository` becomes shared coupling across every scenario that reuses it. Keep steps in domain language so they compose: `Given no registered users`.
- **One step phrase = one step def.** If you're tempted to write a near-duplicate, reword the scenario in the plan instead (back through `grill`), don't fork the step.

## The TDD cycle still holds — it maps cleanly

- **RED** — run `cucumber-js --tags @S1`. With no step defs yet, the scenario is **undefined/pending** (Cucumber prints the snippets to implement); with step defs but no production code, it **fails**. Either is a valid red — but it must fail for the right reason, not a config/import error.
- **GREEN** — write the step defs + the minimum production code to make `@S1` pass.
- **REFACTOR** — on green, clean up production code and step defs. Reuse existing steps rather than adding new ones.

Inside one scenario you'll still run **inner unit cycles** (plain Vitest) for the production code the step defs call into — see `GOOS.md`. The scenario is the outer (acceptance) loop; the unit tests are the inner loop. The scenario stays red until the feature is whole.

## Extras the plan can carry

Real Cucumber unlocks two Gherkin constructs the plain lowering can't use. Use them only when they reduce duplication — don't reach for them reflexively:

- **`Background:`** — shared `Given` steps run before every scenario in a feature.
- **`Scenario Outline` + `Examples:`** — one scenario, a table of cases. Good for boundary/equivalence-class scenarios. Each example row still traces to the parent `@S<n>`.

## One-time setup scaffold (only when adopting fresh)

Do this only when the project has no Cucumber and the user opted in. Sniff the package manager and test assertion lib already in use; match them.

1. **Install** (match the project's package manager):
   ```bash
   pnpm add -D @cucumber/cucumber tsx
   ```
   (`tsx`/`ts-node` so step defs can be TypeScript; skip if the project compiles first.)

2. **Config** — `cucumber.cjs` at repo root:
   ```js
   module.exports = {
     default: {
       require: ["features/steps/**/*.ts", "features/support/**/*.ts"],
       requireModule: ["tsx/cjs"],
       paths: ["features/**/*.feature"],
       format: ["progress-bar", "summary"],
     },
   };
   ```

3. **World** — `features/support/world.ts` for shared context:
   ```ts
   import { setWorldConstructor, World } from "@cucumber/cucumber";
   class TestWorld extends World {
     payload: unknown;
     act: () => unknown = () => {};
   }
   setWorldConstructor(TestWorld);
   ```

4. **Script** — add to `package.json`:
   ```json
   { "scripts": { "test:acceptance": "cucumber-js" } }
   ```

5. **Walking-skeleton first scenario** — before wiring features, get **one** trivial scenario green end-to-end (the GOOS walking skeleton, see `GOOS.md`). It proves the pipeline runs — config, step discovery, World, assertions — before any real behavior leans on it. Verify red first (pending), then green.

6. **CI** — ensure `test:acceptance` runs in the pipeline alongside `vitest run`. Both streams must pass; neither alone suffices.
