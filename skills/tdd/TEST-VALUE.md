# Test value — what to test, at which level

The Iron Law still holds: **no behaviour without a failing test first.** This file decides *which* test: what deserves its own test, and the fastest level that still catches the real failure.

## Before each RED: a one-line test decision

```
<behaviour> → level: <unit|integration|e2e> · why: <failure it catches> · cost: <~ms/s>
```

Put it in the plan step or the commit body. If you can't name the failure the test catches, don't write the test.

## Worth a test

Rank by **likelihood of a bug × cost when it ships**:

1. Domain rules and branching logic — conditions, calculations, state transitions.
2. Edge cases with real consequences — empty, boundary, duplicate, concurrent, out-of-order.
3. Contracts at seams — what one module promises another (inputs, outputs, errors).
4. Anything touching money, data loss, auth/permissions, or user-visible state.
5. Every bug you fix — a regression test that reproduces it first.

## Not worth its own test

Cover these through a behaviour test above them, or let a tool check them:

| Code | Covered by |
|---|---|
| Pass-through wiring, DI setup, re-exports | the acceptance/integration test that runs through it |
| Types, shapes, required fields | the typechecker |
| Private helpers | the public function's tests |
| Framework/library behaviour (router, ORM, zod) | the library's own tests — test *your* use, not theirs |
| Constants, config values, generated code | nothing, or one smoke test |
| Pixel layout, styling | visual/design review, not unit tests |
| A case already pinned at a faster level | nothing — delete the slower duplicate |

Testing these anyway is not "extra safety". It's maintenance cost and slower feedback with no bug caught.

## Speed vs value — pick the fastest level that catches the failure

| Level | Typical cost | Use when the failure lives in… |
|---|---|---|
| Unit (pure, in-memory) | < 10 ms | logic, rules, transformations |
| Integration with fakes at the seam | 10–100 ms | collaboration between your modules |
| Integration with real infra (DB, container, network) | 0.5–5 s | queries, migrations, serialisation, the adapter itself |
| E2E (browser, full stack) | 5–30 s | the scenario's critical path only — one happy path, plus the costliest failure |

Rules:

1. **Push down.** Each behaviour is tested at the lowest level that can see its failure. An E2E test for a validation rule is wrong — the rule goes in a unit test, E2E only checks the wiring once.
2. **Fakes over mocks, real infra only at the adapter.** Test the DB adapter against a real DB once; everything above it uses an in-memory fake of the same interface.
3. **One slow test per path, not per case.** Ten input variations → ten unit tests + one integration test, not ten integration tests.
4. **Budget the feedback loop.** Single test file < 1 s. Unit suite < 10 s locally. Over budget → find the slow tests (`--reporter=verbose`, `--durations`) and push them down or tag them into a separate suite.
5. **Flaky = negative value.** Fix it or delete it the same day; never retry-until-green.
6. **Slow tests live in their own command** (`test:integration`, `test:e2e`), so the inner loop stays fast.

## Red flags

- A test that can only fail when the code is deleted (asserts nothing that could plausibly break).
- Three tests at different levels asserting the same thing.
- A unit test that needs > 3 mocks — wrong seam; see "Listen to the tests" in `SKILL.md`.
- The unit suite got slower this change and nothing explains why.
