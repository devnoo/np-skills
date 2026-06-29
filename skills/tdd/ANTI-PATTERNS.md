# TDD anti-patterns

Read this when introducing mocks, when a test is hard to write, or when the cycle feels like it's "in the way".

## Mocking

- **Don't mock the database.** Use a real test DB (in-memory if you must, but real). Mocked DBs hide migration bugs, transaction semantics, and constraint violations until prod.
- **Don't mock the system under test.** If you're spying on the function you're testing, your test is asserting how the code is written, not what it does. Rewrite the test against the public API.
- **Don't mock what you don't own** without an adapter. Mocking a third-party SDK directly couples your tests to that SDK's surface; if the SDK changes its method names, every test breaks. Wrap it in your own interface and mock the interface.
- **Mock at boundaries, never in the middle.** Network, filesystem, time, randomness — fine to mock. Internal modules — fine to call for real.

## Test smells

- **The test passes the moment you write it.** You skipped RED. Delete, restart.
- **The test is longer than the implementation.** The test is testing too many things. Split.
- **You change the test to match the implementation after a failure.** The test was the spec — changing it to fit broken code is undoing the spec.
- **The test only fails when run in a specific order.** Shared state leaked. Fix the leak, don't add `--runInBand`.
- **The test sleeps.** Sleeps are flakes waiting to happen. Use proper waits (`waitFor`, polling with timeout, deterministic clocks).
- **The test asserts implementation details** (private fields, internal call counts to non-boundary functions). Assert behavior visible to the caller.

## Cycle smells

- **You wrote three tests before any of them was green.** You lost the cycle. Comment two out, get one green, then re-enable the next.
- **You started refactoring while a test was red.** Stop. Refactoring is only legal on a green bar.
- **A refactor changed test results.** It wasn't a refactor — it was a re-implementation. Revert and split into refactor + new behavior.

## When TDD genuinely doesn't fit

Rare but real cases. Document the exception in a comment near the affected code:

- **UI exploration / spike** — throwaway code to learn the shape of a problem. Mark it as such; do not merge it. After learning, delete and rebuild with tests.
- **One-shot scripts** that run once and are discarded.
- **Hot-fix on a production fire** where the alternative is downtime. Ship the fix, then write the test before reopening the PR for normal review.

If you find yourself reaching for these often, the project has a testability problem, not a TDD problem.
