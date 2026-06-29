---
name: codemap
description: Maintain a persistent, project-level reference under docs/codemap/ that grill, write-plan, and code-review load selectively. Use when the user says "map the codebase", "codemap init", "codemap update", "refresh codemap", or when starting work in an unfamiliar repo. Each doc carries a mode tag (discovered / derived / bootstrapped / handwritten) that controls whether the skill is allowed to overwrite it.
---

# codemap

A durable, project-level codebase reference. `grill`, `write-plan`, and `code-review` load these docs selectively so they don't have to re-derive architecture and conventions from source every time. Mode tags keep you in control of what gets overwritten.

## The docs (under `docs/codemap/`)

| Doc               | Mode                     | Source of truth                      | Answers                                                  |
| ----------------- | ------------------------ | ------------------------------------ | -------------------------------------------------------- |
| `ARCHITECTURE.md` | **derived**              | ADRs + plan Architecture sections    | What hard-to-reverse decisions govern this codebase      |
| `STRUCTURE.md`    | **discovered**           | filesystem scan                      | Where code lives; what each top-level module does        |
| `STACK.md`        | **discovered**           | `package.json`, lockfiles, manifests | Runtime, language, frameworks, versions                  |
| `INTEGRATIONS.md` | **discovered + confirm** | imports + env vars                   | External services this repo depends on                   |
| `CONVENTIONS.md`  | **bootstrapped**         | initial scan, then hand-curated      | How we write code here (naming, error handling, modules) |
| `TESTING.md`      | **bootstrapped**         | initial scan, then hand-curated      | How tests are organized and run                          |
| `CONCERNS.md`     | **handwritten**          | user only                            | Tech debt, fragile areas, known issues                   |

You don't have to use all 7. Skip any that doesn't fit your repo — just don't `init` it.

## The modes

| Mode             | Overwrite policy                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **discovered**   | Generated from source. Safe to overwrite on every `update`.                                                              |
| **derived**      | Rolled up from other curated artifacts (ADRs, plans). Safe to overwrite — the source of truth lives elsewhere.           |
| **bootstrapped** | Generated once from source on `init`, then hand-curated. `update` is a **no-op with notice** unless `--force` is passed. |
| **handwritten**  | User-owned. `init` may stub a template; `update` never touches.                                                          |

## Frontmatter (every doc)

```yaml
---
mode: discovered | derived | bootstrapped | handwritten
last_updated: 2026-05-20T14:30:12Z
last_commit: <git SHA of HEAD when last regenerated, or "uncommitted">
sources: [<paths/globs this doc summarizes>]
---
```

`last_commit` enables staleness detection: when `grill` or `write-plan` loads a codemap doc, if `git rev-parse HEAD` ≠ `last_commit`, they warn (but don't auto-regenerate — refresh is explicit).

## Commands

### `codemap init`

First-time setup for a repo. Dispatch parallel subagents (`Agent` tool, `subagent_type: Explore`) — one per doc — to scan the codebase and write the initial version. Steps:

1. Create `docs/codemap/` if it doesn't exist.
2. For each doc the user wants (default: all 7), dispatch a subagent with a focused prompt: "Read this codebase and write `docs/codemap/<DOC>.md` covering <X>." Use parallel tool calls.
3. Wait for all subagents to return.
4. Write frontmatter to each generated file with the current commit SHA and timestamp.
5. Show the user the list of files generated. For `bootstrapped` and `handwritten` docs, prompt: "Review and edit these before treating them as authoritative."

### `codemap update <doc>` (or `update --all`)

- For `discovered` (STRUCTURE, STACK, INTEGRATIONS):
    - Re-scan and overwrite.
    - For `INTEGRATIONS`: diff against the previous version, list new integrations found, ask user to confirm before writing.
- For `derived` (ARCHITECTURE):
    - Walk `docs/adr/` — extract title, status, decision summary per ADR.
    - Walk `docs/plans/` — extract Architecture sections from plan files.
    - Write a curated rollup that links each item back to its source.
- For `bootstrapped` (CONVENTIONS, TESTING): **refuse** unless the user passes `--force`. Print: "`<doc>` is mode `bootstrapped` — refusing to overwrite hand-tuned content. Re-run with `--force` to regenerate from scratch."
- For `handwritten` (CONCERNS): **refuse**. Print: "`CONCERNS.md` is mode `handwritten`. Edit it directly."

`update --all` only touches `discovered` and `derived` docs by design. Bootstrapped/handwritten require explicit per-doc invocation with `--force`.

### `codemap status`

For each doc under `docs/codemap/`: report mode, `last_commit`, current HEAD, staleness verdict (`fresh` if SHAs match, `stale (N commits behind)` otherwise), and last-updated timestamp.

## How other skills use codemap

- **`grill`** (when present) loads `ARCHITECTURE.md` for context. If the user's question touches conventions or testing, also load `CONVENTIONS.md` or `TESTING.md`. Warns if any loaded doc is stale.
- **`write-plan`** loads `STRUCTURE.md` to validate file paths in `Files:` sections and `CONVENTIONS.md` to seed naming. Warns if stale.
- **`code-review`**'s reviewer prompt is augmented with `CONVENTIONS.md` so style findings cite the codified convention.
- **`np-orchestrator`** does not auto-load — sub-skills decide what they need.

Selective loading matters: don't dump every doc into every prompt. The whole point is small, targeted context.

## Refresh strategies (not wired by this skill)

Outside this skill, you have two options to keep `discovered` and `derived` docs fresh automatically:

1. **Git post-commit hook on default branch only.** `.git/hooks/post-commit` runs `claude -p "/codemap update --all" &` only when `git rev-parse --abbrev-ref HEAD` is `main` or `master`. Recommended — refreshes when canonical architecture actually moves, skips feature-branch churn.
2. **Daily cron.** Schedule via the `schedule` skill: `0 9 * * * cd <repo> && claude -p "/codemap update --all"`. Cheaper, less precise — runs even when nothing changed.

The skill itself only ever runs when invoked manually. Pick one of the above if you want automation.

## What this skill does NOT do

- Does not maintain a knowledge graph (GSD's graphify). Out of scope.
- Does not inject codemap docs into every prompt — sub-skills load selectively.
- Does not overwrite `bootstrapped` or `handwritten` docs without explicit user action.
- Does not delete docs. If a doc becomes irrelevant, the user deletes it.
