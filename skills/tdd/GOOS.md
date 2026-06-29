# Growing Object-Oriented Software, Guided by Tests (GOOS)

The implementation philosophy behind this skill, from Steve Freeman & Nat Pryce. The plan's scenarios are the **acceptance tests** (outer loop); the red-green-refactor unit cycle is the **inner loop**. This doc covers the four GOOS ideas that the bare cycle doesn't: the walking skeleton, outside-in development, mocking roles to discover interfaces, and listening to the tests.

## 1. Start with a walking skeleton

Before building features, get the **thinnest possible end-to-end slice** running through the *real* architecture — the smallest thing that exercises the actual deployment/build/test pipeline from edge to edge.

- It implements almost no behavior. Its job is to prove the pieces connect and the acceptance-test harness actually runs end to end.
- Example: for a webhook service, the skeleton is "an HTTP request reaches a handler that returns 200 and the acceptance test observes it" — no parsing, no persistence yet.
- The first scenario you make pass should be this skeleton. Verify it red (the harness reports a real failure), then green.
- **In a plan**, the walking skeleton is Task 1 whenever the feature is a *new surface* (new service, new endpoint family, new screen flow). For adding a field to an existing, already-skeletoned system, skip it — the skeleton already exists.

Why: it surfaces integration and deployment problems on day one, when they're cheap, instead of after all the units are written and "just need wiring up."

## 2. Develop outside-in

For each feature, write the **acceptance test first** (the scenario), watch it fail, then work *inward*:

1. The failing scenario names the system's outermost behavior in domain terms.
2. To make it pass, you need a top-level object. Write a **unit test** for that object. It will need collaborators it doesn't have yet.
3. **Don't build the collaborators yet.** Invent the *interface* you wish they had and mock it (see §3). The unit test passes against the mock.
4. Now those mocked interfaces are a to-do list. Drop down a level and TDD each collaborator for real, the same way.
5. Climb back up. When the real objects replace the mocks all the way down, the acceptance scenario goes green.

This is why the scenario stays red for many inner cycles: it's the last thing to pass, not the first. Keep it in a **separate acceptance suite** (tagged so its red is intentional) so it doesn't trip the per-task "all green before commit" rule — only the unit suite gates each commit. See `SKILL.md` ("The double loop").

## 3. Mock roles, not objects — to discover interfaces

GOOS uses mocks as a **design tool**, not just a test shortcut. When an object needs a collaborator, you ask "what do I wish this collaborator could do for me?" — express that as a small **role interface**, mock it, and let the mock define the protocol between the two objects.

- **Mock the role you're designing**, the one you own and are about to create. The mock's expectations *are* the emerging interface.
- **Mock expectations assert the conversation between objects** ("tell, don't ask"): the object under test should *tell* its collaborator to do something, and the mock verifies it did. This drives small, intention-revealing interfaces.
- **Only mock types you own.** Never mock a third-party SDK, the database, the clock, or value objects — wrap externals in your own adapter interface and mock *that*. (Same rule as `ANTI-PATTERNS.md`; here it's the positive form.)
- **Don't mock values.** Use real value objects and real data. Mocks are for *services/collaborators with behavior*, not for data.
- A method with no collaborators to coordinate needs **no mocks** — just assert its return value. Don't manufacture mocks where a plain assertion does.

If mocking is painful — too many expectations, mocks returning mocks — the object has too many collaborators or the seam is in the wrong place. That's §4.

## 4. Listen to the tests

A hard-to-write test is the design talking. Common signals and what they mean:

| The test is… | The design is saying… |
|---|---|
| Hard to set up (lots of construction) | Too many dependencies — split the object or introduce a higher-level abstraction. |
| Full of mocks, or mocks returning mocks | The object coordinates too much, or you're mocking across the wrong boundary. |
| Asserting private state / internal calls | The behavior wants to live in a different object where it's observable. |
| Needing the same big setup as five others | A missing concept — extract it and give it its own tests. |
| Brittle to unrelated changes | Tests (and code) coupled to incidental detail, not behavior. |

The fix is always to change the **design**, then the test gets easy. Never make the test ugly to fit awkward code — that locks the bad design in.

## How this maps onto the np-skills flow

- `grill` authors scenarios → these are the GOOS **acceptance tests** (outer loop).
- `write-plan` orders tasks **outside-in** and puts a **walking-skeleton** task first for new surfaces.
- `tdd` runs the **inner** unit loop, mocking roles to discover interfaces and listening to the tests.
- `code-review` checks that interfaces stay small and that mocks sit on owned boundaries, not in the middle.
