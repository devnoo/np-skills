---
name: grill-technical
description: Do the architecture work for a functionally-grilled spec — read the project's architecture, propose where each feature lands, discuss the placement with the user, then ask the technical questions that remain, and at last grill the design part by part (module cards, contracts, sequences) into the spec's How section. Use after grill-functional and before implement / to-issues, or when the user says "technical grill", "architecture for this", "where does this go", "which modules does this touch", or "what contracts change". Vocabulary adapted from mattpocock/skills codebase-design.
---

# grill-technical

`grill-functional` settled **what** is built. This is the architecture work: **where it goes and how the parts talk**. It decides no behavior.

```
1. READ + PROPOSE      2. DISCUSS PLACEMENT     3. TECHNICAL QUESTIONS   4. GRILL THE DESIGN
project architecture,   where each feature goes, what is still open       cards, contracts,
how the features fit    which module owns what   after the placement      sequences: draft,
→ one proposal          → agreed placement       → decisions              grill, confirm, write
```

## Concise, always

- **A turn is one diagram or table plus at most three lines.** No intro, no recap.
- **Diagrams and tables, not prose.** No paragraph longer than two lines, in chat or in the spec.
- **`## How` fits on three screens; a module card on one.** Longer means a module does too much or a card leaks internals.

## 1. Read, then propose

Do this before saying anything to the user.

1. The spec needs confirmed features (`F<n>`) and scenarios (`S<n>`). Missing → stop, back to `grill-functional`.
2. Read [VOCABULARY.md](./VOCABULARY.md). Say **module**, **interface**, **seam**, **adapter**.
3. Read the project's architecture, by sending an `Explore` subagent that returns conclusions only: the modules and what each owns, how they talk (calls, events), the layering rules, and the ADRs (`docs/adr/`), glossary (`CONTEXT.md`), `feature-map.json` or architecture model if present.
4. Fit the features in. For each `F<n>`: which existing module already owns something like it? What would have to be new?

Then show **one proposal**: the architecture as it is, with the change drawn in, and a placement table.

```markdown
          tracker ──▶ issues ──▶ tasks ──▶ [run-queue] ──▶ boxes
                                   │        NEW   │
                                   └── events ◀───┘

| Feature | Lands in | New or existing | Why there |
| --- | --- | --- | --- |
| F1 cancel a run | run-queue | new module | owns run state |
| F2 held runs say why | run-queue | new module | the reason comes from its rules |
| F3 the issue is told | issues | existing, unchanged | already talks to the tracker |
```

- Mark new parts `[like this]`. Draw only modules the feature touches or calls.
- **Existing homes beat new modules.** Propose a new module only when no existing one can own the behavior behind its current interface.
- **Follow the project's own rules.** Its layering, its ADRs, its naming. Where the proposal breaks one, say so in the table.
- **Two placements both defensible?** Show both side by side with one line of trade-off each, recommend one. For a shape-defining choice use `design-it-twice`.

## 2. Discuss the placement

Talk it through until the user agrees where everything goes. This is a conversation about the picture, not a questionnaire.

- The user corrects the picture: "F3 belongs in tasks". Redraw, update the table, show it again.
- Push back when a move breaks a rule: a module reaching past another's interface, a core depending on an adapter, a second module owning the same state.
- **Never ask what the code can answer.** "Who calls this?" is a search.
- Done when the user says the placement is right. Write the diagram and table into `## How` at once.

## 3. Technical questions

Only now, and only what the agreed placement leaves open at the level of the whole design. One question per turn, in chat, with your recommendation first and one line per alternative.

- The *Technical questions* that `grill-functional` parked in the spec, first.
- **Breaking changes** — who consumes what changes today, and how do they migrate?
- **Data** — schema changes, backfill, rows written before the change.
- **Configuration** — which numbers the spec calls configurable, and where they are set.

Skip a question whose answer the project's rules already give. A behavior gap found here goes back to `grill-functional`; never patch behavior in the design.

## 4. Grill the design

The relentless part. Go through the five parts of `## How` below, **one part at a time**: draft it from the code and the answers so far, show it, grill every open choice in it to the end, get it confirmed, write it into the spec. Then the next part.

```
placement ✔ ─▶ module cards ─▶ contracts ─▶ sequences ─▶ test seams
               draft · show · grill · confirm · write   (each part)
```

What to grill on, per part:

| Part | Push on |
| --- | --- |
| Module cards | each export: who outside calls it, why can it not stay internal? · what is pure core, what touches the outside? · is every outside thing a port? |
| Contracts | exact names, types, defaults · error modes · ordering · who must change |
| Sequences | what if this call fails, times out, runs twice, or races another? |
| Test seams | is this the highest seam? what fake does it need? |

- **One decision at a time.** Every branch is resolved or explicitly "deferred — does not block". "We'll see during the build" is not an answer for an export or a contract.
- **Draft, don't interrogate.** Always show your version first; the user corrects it.
- **Never ask what the code can answer.**
- **Two defensible shapes for a contract → `design-it-twice`.**

## Rules that hold throughout

1. **Trace everything to a feature or scenario.** A module or contract with no `F<n>` / `S<n>` behind it is scope creep.
2. **The export list is closed.** A module card lists everything the module exports. Anything else stays internal. One more export later is a design change: back here.
3. **Ports and adapters inside.** Every new or reshaped module is hexagonal unless an ADR says otherwise: a pure core, a port per outside dependency, adapters behind the ports. The core imports no adapter, no framework, no other module's internals.
4. **Existing seams beat new ones.** Two adapters make a real seam; one is hypothetical.

## The `## How` section

Added to the spec file after the scenarios. Five parts, in this order. The first is the agreed diagram and placement table from step 2; the other four are grilled in step 4.

### 1. Placement and impact

The agreed diagram and placement table, then one row per module. List modules that are *called but unchanged* too — they are the blast radius.

```markdown
| Module | Change | Scenarios | Interface changes? |
| --- | --- | --- | --- |
| run-queue | new | S1–S4 | — (new, see C1) |
| dispatcher | modified | S1, S3 | yes — C2 |
| tracker port | called, unchanged | S2 | no |
```

`Change` is one of: `new` · `modified` · `called, unchanged` · `deleted`.

### 2. Module cards

One card per `new` or `modified` module. This is the part the user must be able to read in a minute and say "yes, that is the interface".

````markdown
#### run-queue

```
            callers: dispatcher, http routes
                        │
        ┌───────────────▼────────────────┐
        │ exports (interface below)      │
        │  RunQueue · QueueEvent · layer │
        ├────────────────────────────────┤
        │ core (pure)                    │
        │  decider: Command → Event[]    │
        ├────────────────────────────────┤
        │ ports (needed from outside)    │
        │  QueueStore · Clock            │
        └───────┬────────────────┬───────┘
                ▼                ▼
        postgres adapter    system clock
```

```ts
// run-queue — the whole exported interface
export interface RunQueue {
  /** Called by: http routes. The only way in. */
  enqueue(run: NewRun): Effect<Position, QueueFull>
  /** Called by: dispatcher. Never returns more than `capacity` runs. (C2) */
  claimNext(project: ProjectId, capacity: number): Effect<Run[]>
}
/** Read by: insights. */
export type QueueEvent = RunQueued | RunStarted | RunEnded
/** Used by: server wiring. */
export const layer: Layer<RunQueue, never, QueueStore | Clock>

// ports — what the core needs from outside
interface QueueStore { load(id: RunId): Effect<Run>; save(run: Run): Effect<void, StaleVersion> }
interface Clock { now(): Date }
```

Not exported: decider, commands, store rows, adapter constructors.
````

- **The interface is written as code**, in the project's own language and style (here TypeScript with Effect): real signatures with parameter, return and error types. No bodies.
- **Every export carries a one-line comment**: who calls it, plus any invariant or ordering rule a caller must know.
- **Complete list.** What is in the code block is what the index file exports. Count them — more than about five needs a reason.
- **The box shows structure only**: export names, core, ports, adapters. Signatures live in the code block, once.
- **Core**: named in one line each. Pure: same input, same output, no I/O.
- **Ports**: one per outside dependency, named for what the core needs (`QueueStore`), not for the technology (`PostgresClient`).
- **Adapters**: which adapter fills each port in production, and which fake fills it in tests.
- **Not exported**: name the things most tempting to leak.
- A `modified` module shows its export list **after** the change, and marks each line `new`, `changed`, `removed` or leaves it blank.

### 3. Contracts

Every **existing** interface that changes (new ones are fully described by their module card), ID'd `C1`, `C2`, ….

**A contract is a code block.** No code block, no contract. Written in the project's language, before and after, signatures and types only.

````markdown
#### C2 — dispatcher calls `claimNext`  (modified, breaking) · S1, S3

```ts
// before
claimNext(project: ProjectId): Effect<Run | null>
// after
/** Never returns more than `capacity` runs. */
claimNext(project: ProjectId, capacity: number): Effect<Run[]>
// removed
releaseWaiting(issue: IssueId): Effect<void>
```

Must change: runner loop, merge-queue.
Migration: expand-then-contract.
````

Under the code block, only these two lines, each one line: **Must change** (consumers, found by search) and **Migration**. Nothing else.

| The contract is… | Write it as |
| --- | --- |
| a function or port | its signature, inside its `interface` |
| an event or message | its payload `type` |
| a job, request or config shape | the `type`, changed fields marked `// new` · `// changed` · `// removed` |
| a schema change | the table definition, changed columns marked |
| a route | method and path, request and response `type` |

- **Never describe a contract in sentences.** "The box pushes the work, uploads the conversation, then sends `parked`" is behavior: it belongs in a scenario or a sequence. Put the scenario ID in the title and stop.
- **Invariants, ordering and error modes** go in a one-line doc comment or in the error type.
- **One contract, one interface.** Several changes to one interface share a block; changes to two interfaces are two contracts.
- **A contract longer than about fifteen lines is two contracts**, or it is leaking internals.

### 4. Sequences

One ASCII sequence diagram per scenario (or group of scenarios) that crosses two or more modules. Title it with the scenario IDs.

````markdown
#### S1, S3 — a queued run starts when capacity frees up

```
dispatcher            run-queue               box
    │                     │                    │
    │ claimNext(p, cap)   │                    │
    ├────────────────────>│  C2                │
    │       [run]         │                    │
    │<┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┤                    │
    │ start(run)          │                    │
    ├─────────────────────────────────────────>│
    │                     │       RunStarted   │
    │<╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤  async
```
````

- Participants are modules from the Impact table, nothing else. Internals (core, adapters) never appear — if a sequence needs them to make sense, the module's interface is wrong.
- Every message is an export on a module card. A call that is not on a card is a missing export or a leak.
- Label a message with its contract ID when it crosses a changed contract.
- Solid arrow = call, dotted = return, mark async events `async`.
- Draw the failure path as its own diagram when an error scenario changes who calls whom.

### 5. Test seams

Where each scenario is tested. Use the **highest** existing seam; the ideal number of seams is one.

```markdown
| Seam | Scenarios | Fakes needed |
| --- | --- | --- |
| run-queue interface | S1–S4 | in-memory clock |
```

## Keep out

| Out | Why |
| --- | --- |
| Scenario text | Lives in `## Scenarios`. Reference by ID. |
| File paths with line numbers, function bodies | Go stale; `tdd` decides them. |
| Task order, estimates | `implement` / `to-issues`. |
| New behavior | `grill-functional`. |

## Format check, before every turn and every write

Run this on what you are about to show or write. Fix it first; never send it and apologise after.

| Check | Fails when |
| --- | --- |
| Interfaces are code | a module card or contract has no fenced code block, or its signatures sit in a sentence or a table |
| No retold behavior | a contract says what happens ("the box pushes…, then sends…") instead of pointing at `S<n>` |
| No labelled prose | lines starting `Before:`, `After:`, `Invariant:`, `Removed:`, `Consumers:` followed by sentences |
| Size | a contract over about fifteen lines, a card over one screen, a paragraph over two lines |

Inline code inside a sentence is not a code block.

**Resuming a spec that already has a `## How`:** run the same check on what is there. Parts that fail are redone in the current format before you continue, even if they were confirmed: say which parts you redid, keep the decisions, change only the form.

## Before handing off

1. Every feature is placed; every scenario appears in a Test seam row.
2. Every `new` / `modified` module has a card; every export on it has a named caller.
3. Every sequence message is an export on a card; every participant is in the Impact table.
4. Every outside dependency of a core is a port with a production adapter and a test fake.
5. Every changed contract lists its consumers; every breaking one has a migration line.
6. Every technical question is decided or explicitly "deferred — does not block".
7. The whole `## How` passes the format check above.
8. The user agreed the placement and confirmed each module card.

## After the build

The cards are checked against the code, by `code-review`:

- The module's index file exports exactly the card's export list — nothing more.
- No file outside the module imports past its index.
- The core imports no adapter.

A mismatch is a finding. Fix the code, or come back here and change the card with the user.

**ADR offer:** a contract or seam choice that is hard to reverse, surprising without context, and a real trade-off → offer the `adr` skill.

Then ask: "How-section is in `<spec path>`. Build it (`implement`) or cut issues (`to-issues`)?"
