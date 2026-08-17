---
name: verify-architecture
description: >
    Detect drift between the LikeC4 architecture model (docs/architecture/<model>.likec4) and the
    actual Bun/Turborepo code, in both directions, and reconcile it. Use when the user says
    "verify architecture", "check architecture drift", "does the diagram match the code", "is the
    architecture up to date", "the diagram is stale", after adding/removing an app or package, or
    when reviewing a PR that changes apps/, packages/, or docs/architecture/. Reports containers in
    the model with no code, code with no container, and runtime relationships to sanity-check. Then
    lets the user choose per finding to update the diagram (model←code) or update the code (code←model).
---

# Verify architecture

Compares `docs/architecture/<model>.likec4` against the real workspace and helps close the gap.

## Quick start

```bash
node .agents/skills/verify-architecture/scripts/check-arch.mjs           # markdown report
node .agents/skills/verify-architecture/scripts/check-arch.mjs --json    # for further reasoning
```

The script does the **deterministic structural check** (element existence, both directions). It
is provenance-aware via the model's tags: `#built` containers must map to a workspace, `#offshelf`
/`#managed` are optional, `#future` is skipped. See [REFERENCE.md](REFERENCE.md) for the drift
categories, the `sourcePath` anchoring convention, and CI wiring.

## Modes

**CI (advisory):** `.github/workflows/architecture-drift.yml` runs the script on PRs and posts the
report as a sticky comment. It never blocks — it informs. Nothing to do here; it is already wired.

**Interactive:** run the script, then work the findings with the user.

## Interactive workflow

1. Run the script (`--json`) and read the structural findings.
2. **Semantic pass (heuristic):** for each `relationship` in the JSON, sanity-check it against the
   code — grep the source container's `sourcePath` for the SDK/client/env-var implied by the edge
   (e.g. `@logto/*` for an OIDC edge, a NATS client for an event-bus edge, an S3 client for object
   storage). Flag edges with no evidence as low-confidence "possibly stale". Do **not** assert a
   relationship is wrong from a single grep — present it as a question.
3. Present the consolidated drift list to the user. For **each** finding, ask which direction:
    - **Update the diagram (model←code)** — the code is right, the model is stale. Edit
      `docs/architecture/<model>.likec4` directly: add/remove a `container`, fix a relationship, or
      anchor a container with `metadata { sourcePath '...' }`. Use the `likec4` skill's
      `references/*.md` for DSL syntax. Then run `bun arch:check` to validate. (The published views
      regenerate from the model via `architecture-pages.yml` — no image editing needed.)
    - **Update the code (code←model)** — the architecture is right, the code drifted. Do **not**
      hand-edit. Compose `write-plan` to produce a TDD-shaped plan, then `tdd` to implement, so the
      change lands with tests. Code changes go through the normal quality gate.
    - **It's intentional / a real decision** — if the drift reflects a deliberate choice (e.g. the
      website subsystem is deliberately out of the core model), capture it with the `adr` skill
      rather than "fixing" it, and optionally add a model note.

4. After model edits, re-run the script to confirm the finding cleared. After code plans, the drift
   clears when the plan merges.

## Composition

- `likec4` — DSL reference docs for editing the model (`../likec4/references/*.md`).
- `write-plan` + `tdd` — the code←model remediation path.
- `adr` — record intentional divergences instead of churning the model.
- `code-review` — the reporting mechanism this mirrors (subagent + PR comment).

## Anchoring (do this first when accuracy matters)

Name matching is a fallback. Add `metadata { sourcePath 'apps/<name>' }` to each `#built`
container so existence checks become exact. Anchored containers: `portal`, `adminConsole`, `api`,
`cms`. Anchor new ones as they are built.
