---
name: code-review
description: Run a structured code review of the current branch by dispatching a subagent with a curated reviewer prompt. Use after completing tasks, after a major feature, or before merging. Reviewer gets the plan as the source of truth, not session history. Adapted from obra/superpowers requesting-code-review.
---

# code-review

You do not perform the review yourself. You **dispatch a reviewer subagent** with a clean context, so the review is grounded in the plan and the diff — not in whatever rationalizations accumulated during implementation.

The reviewer's core job is **drift detection**: catching every place the implementation diverged from the plan-as-contract. Only a context-free reviewer can do this honestly — the implementer has already rationalized each drift as it happened.

## Inputs you must gather

Before dispatching, collect:

| Variable | How to get it |
|---|---|
| `{PLAN}` | The plan file path under `docs/plans/`. If multiple, ask the user which one. |
| `{BASE_SHA}` | `git merge-base HEAD origin/main` (or origin/master). |
| `{HEAD_SHA}` | `git rev-parse HEAD`. |
| `{DESCRIPTION}` | One-paragraph description of what was built, written by you, derived from the plan goal + actual diff. |

If the project isn't a git repo, skip the SHAs and replace with `(uncommitted working tree)`.

## Dispatching the reviewer

Use the `Agent` tool with `subagent_type: general-purpose`. The prompt is the contents of `code-reviewer-prompt.md` in this skill directory, with the placeholders substituted.

The reviewer:
- Reads the plan.
- Reads `git diff {BASE_SHA}..{HEAD_SHA}` (or working tree if no SHAs).
- Reads any files referenced by the diff to understand context.
- Returns findings in three categories: **Critical** (block merge), **Important** (fix before proceeding), **Minor** (note for later).

## After the reviewer returns

1. Summarize findings to the user in the three categories.
2. For each Critical or Important finding, ask the user whether to fix now, defer with a follow-up task, or dismiss with justification.
3. If the user fixes anything, run `code-review` again (a new reviewer dispatch) — the second pass catches whether the fix introduced new issues.

## What this skill does NOT do

- Does not approve the code yourself. The user decides what to do with findings.
- Does not touch code. Fixes happen in a separate `tdd` cycle.
- Does not skip findings because "they're style". Style findings are Minor — surface them, don't suppress them.

## Cadence

- After every task in subagent-driven dev: **mandatory**.
- After completing a feature: **mandatory**.
- Before merge to main: **mandatory**.
- During exploration / spike: **skip** — review when the code stops being throwaway.
