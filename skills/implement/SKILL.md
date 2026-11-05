---
name: implement
description: Implement a spec, plan task, or ticket end to end — test-first, clean, and inside the project's architecture. Use when the user says "implement this", "build this ticket/task/spec", or when another skill (pickup-issue, build-with-workflow, build-with-team) hands an implementer a unit of work.
---

# implement

One skill for every language. The process is the same everywhere; only commands and idioms differ, and those live in `lang/<language>.md`.

```
RULES (always on)
  1. ORIENT    → architecture, seams, success criteria, base ref
  2. BUILD     → tdd double loop; light refactor per cycle
  3. REFACTOR  → clean-code pass over the whole changeset
  4. GATE      → typecheck · full suite · architecture · code-review
  5. COMMIT
```

## Rules — apply during every step

1. **Think before coding.** State assumptions. If the work has two readings, name both and ask — don't pick silently. If something is unclear, stop and say what.
2. **Simplest thing that passes.** No features beyond the ask. No abstraction with one user. No config nobody asked for. No error handling for impossible states. If 200 lines could be 50, rewrite.
3. **Every changed line traces to the task.** Don't reformat, re-comment, or "improve" code the task doesn't touch. Match the existing style.
4. **Clean the code you touch.** Code you add or change meets the clean-code bar (see Step 3). That includes renaming or moving a symbol you touched, even when the rename ripples into caller files or the move changes imports — those edits stay mechanical (rename/import only, no other change in the caller).
5. **Untouched smells get parked, not fixed.** Log them (board todo, or a line in the final report) with `file:line`.
6. **Success is a check, not a feeling.** Every step below ends on something you ran.

## Step 1 — Orient

1. Record the **base ref** (current `HEAD`, or the commit before your first change). Step 3 diffs against it.
2. Read the work item: spec, plan task, or ticket, plus its scenarios (`[S<n>]`) if it has them.
3. Read the architecture, whichever exist:
   - `docs/architecture/*.likec4` — containers and allowed dependencies
   - `docs/adr/` — decisions you must not undo
   - `CONTEXT.md` / glossary — domain names to use
   - `CLAUDE.md` / `AGENTS.md` / `CONSTRAINTS.md` — project rules and quality bar
4. Detect the language(s) touched and read `lang/<language>.md`. No file for it → sniff the project's build/test config and use what's there.
5. Write a short plan, one line per step, each with its check:
   ```
   1. <step> → verify: <test> · level: <unit|integration|e2e> · catches: <failure>
   ```
   Choose what to test and at which level with `tdd/TEST-VALUE.md` — value (bug likelihood × cost) against speed.
   Name the **module** each change lands in and the **seam** each test sits at (vocabulary: `improve-architecture`).

**Stop and ask** if the work needs a dependency edge the architecture model doesn't allow, contradicts an ADR, or adds a new module/package/app.

Done when: the base ref is noted, the plan exists, every step has a check, and every change has a home module that the architecture allows.

## Step 2 — Build (TDD)

Follow `tdd` exactly: outer acceptance test per scenario, inner RED → VERIFY RED → GREEN → VERIFY GREEN → REFACTOR.

While building:
- Run **typecheck** after each GREEN.
- Run **the single test file** you're working in after each change; the full unit suite at VERIFY GREEN.

**REFACTOR step (per cycle) stays light:** fix names, delete orphans your change created, and remove obvious duplication. Leave structural cleanup (splitting functions, moving code, reordering files) for Step 3, when the whole shape is visible.

Done when: every planned step's check passed and every scenario this work completes is green.

## Step 3 — Refactor the changeset

Now the behaviour is pinned by tests, clean up everything the change touched as one set.

1. List the changeset: `git diff --stat <base>` (plus untracked new files). Every touched function is in scope; untouched code is not (rule 5).
2. Run the checklist below over every touched function, in order:
   1. Function is orchestrator *or* implementer, never both (stepdown rule).
   2. Public/high-level first, helpers below (newspaper order).
   3. Names reveal intent and are consistent across the changeset — rename now (rule 4 covers callers).
   4. Function ≤ ~20 lines, does one thing, nesting ≤ 2, args ≤ 3, no flag args.
   5. No duplicate within the changeset or of something that already exists — search before keeping a helper.
   6. Follows the codebase's dominant pattern (errors, validation, logging, exports).
   7. Each concept lives in the module the architecture says it belongs to — move it if not.
   8. Orphans your change created (imports, vars, functions) are deleted.
3. Apply **one refactoring at a time**; run the affected tests + typecheck after each. Red → revert that step, note it, move on.

Full smell list: `clean-code-refactoring`. Rule 2 wins ties: don't split a 10-line function into three classes to satisfy a checklist.

Done when: every touched function has passed the checklist (or has a noted reason it doesn't), and tests + typecheck are green.

## Step 4 — Gate

Run all of these; each must be clean:

1. Typecheck (whole project).
2. Lint.
3. Full test suite, once.
4. `verify-architecture` if a LikeC4 model exists — no new drift.
5. `code-review` on the diff since you started. Fix what it finds, re-run 1–3.
6. Diff scan: every changed line traces to the task or to a rule-4 rename/move. Revert anything else.

Done when: 1–6 are green and nothing in the diff is unexplained.

## Step 5 — Commit

Commit to the current branch with the project's VCS (git or GitButler — check before writing). Message describes the behaviour, not the test mechanics. Skip if the user or calling skill said not to commit.

Report in this order: what works now · what's blocked · parked smells/todos.
