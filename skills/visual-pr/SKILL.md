---
name: visual-pr
description: Write or update a pull request description as a compact visual outline — one-sentence why, 1-3 reviewer notes, and diff-style views of the changed shapes. Only use when the user invokes visual-pr by name.
disable-model-invocation: true
---

# Describe a Pull Request

Create or update the pull request for the current task with a concise description that helps a reviewer understand why the change exists and the shape of the implementation.

## Workflow

1. Read the description template: `references/pr_description_template.md` (this skill directory).

2. Identify or create the pull request:
   - Check the current branch for a PR with `gh pr view --json url,number,title,state,baseRefName,headRefName,body 2>/dev/null`.
   - If no PR exists, inspect `git status --short --branch` and the commits on the current branch.
   - Commit task-related changes when needed, push the branch with an upstream, and create a PR for it. Follow the repository's git safety protocol.
   - Ask the user to select a PR only when the current branch has no relevant work and there is no safe current-branch PR to create.

3. Gather only the context needed to explain the change:
   - Read the ticket and any relevant task artifacts — for np-skills work, the spec and plan under `docs/plans/` and any ADRs they reference.
   - Read the complete PR diff and enough surrounding code to understand behavior and ownership.
   - Use `gh pr view` to collect PR metadata and changed files.
   - Read `references/show-me.md` for the visual-outline conventions used in the PR body.

4. Write the PR description using the template:
   - Keep **Why the change** to exactly one sentence.
   - Keep **Special things to note** to 1-3 bullets. Prioritize reviewer warnings, migrations, compatibility constraints, deliberate omissions, or surprising decisions. Write `- None.` when there are no special considerations.
   - Make **Change outline** a compact, `show-me`-inspired structural view rather than prose or a file-by-file changelog.
   - Include only the views that help explain this PR:
     - SQL table and endpoint contract changes, plus pseudocode for business logic.
     - key data structure / type changes
     - A shallow file tree showing changed responsibilities.
     - React component tree changes, including important hooks, state, and package boundaries.
     - Call-tree, call-stack, control-flow, or data-flow changes.
   - Prefer `diff` blocks when showing changes to an existing shape. Show the complete target shape when most of it is new or diff notation would obscure ownership or order.
   - Keep each view focused on what a reviewer needs. Omit categories that did not change.
   - Optional: if you know a ticket id/url, the spec or plan path, ADRs, a parent PR, or other relevant links, put them in the header; otherwise omit the header.

5. Save and publish the description:
   - Save it to `$(git rev-parse --git-dir)/visual-pr/pr-{number}.md` — local to the clone, never committed.
   - If the PR already has a body, save that first to `pr-{number}.previous.md` beside it so it can be restored.
   - If the PR was not created in this session, show the user the draft and get a yes before overwriting the existing body.
   - Update the PR with `gh pr edit {number} --body-file {output-path}`. Without `gh`, `PATCH /repos/{owner}/{repo}/pulls/{number}` with `{"body": ...}` and `$GH_TOKEN` does the same.
   - Confirm the update succeeded.

6. Report completion:
   - Read `references/describe_pr_final_answer.md`.
   - Respond using that final answer template with the PR URL, saved description path, and concise list of changed files.

Always read and follow `references/pr_description_template.md`. Do not expand the PR body beyond that template.

Write as one human talking to another: avoid jargon and slang, and use simple, coherent, concise language.
