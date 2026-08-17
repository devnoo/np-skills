# verify-architecture — reference

## How the structural check works

`scripts/check-arch.mjs` exports the **computed** LikeC4 model to JSON (`bunx likec4 export json
docs/architecture`) rather than parsing the DSL — so it sees the same model the viewer does,
including resolved tags, metadata, and relationships. It then lists real workspaces from
`apps/*` and diffs the two.

The check is deterministic and bounded to **container ↔ app** altitude. It does **not** verify
runtime relationships (those are the agent's heuristic job — see SKILL.md step 2).

## Provenance tags drive strictness

The model tags every container with its provenance (see the `specification` block in the model).
The checker uses them so it only demands code where code is expected:

| Tag        | Meaning                          | Existence rule                           |
| ---------- | -------------------------------- | ---------------------------------------- |
| `built`    | source we own                    | **must** map to a workspace              |
| `offshelf` | software we run but don't author | optional — verified only if `sourcePath` |
| `managed`  | Scaleway managed service         | optional — verified only if `sourcePath` |
| `future`   | planned, not yet built           | skipped entirely                         |

This is why the two planned engines (`applicabilityEngine`, `derivationEngine`) never show up as
drift, and why managed infra (`db`, `eventBus`, `objStorage`) is not expected to have a workspace.

## sourcePath anchoring

The reliable way to map a container to its code is the metadata key `sourcePath`:

```likec4
api = container 'Backend API' {
  #built
  metadata { sourcePath 'apps/api' }
}
```

When present, the checker verifies the path exists and never name-guesses. Without it, a `#built`
container is matched to an app by normalized name (`adminConsole` → no `apps/adminconsole`, so it
**must** be anchored — its dir is `apps/admin`). Prefer anchoring over relying on name matching.

## Drift categories (the `kind` field)

| kind                  | direction    | confidence | meaning                                                       |
| --------------------- | ------------ | ---------- | ------------------------------------------------------------- |
| `code-not-in-model`   | code → model | high       | a workspace exists that no container represents               |
| `modeled-not-in-code` | model → code | high       | a `#built` container has no `sourcePath` and no matching app  |
| `stale-source-path`   | model → code | high       | a container's `sourcePath` points at a dir that doesn't exist |
| `unanchored`          | model → code | medium     | a `#built` container matched an app by name only — anchor it  |

## Resolving each category

- **code-not-in-model** → either add a container to the model (model←code), or it's deliberately
  out of scope → record with `adr` and leave it. Example: the public `website` /
  `website-access-gateway` / `storyblok-webhook` / `apex-redirect` apps are currently unmodeled.
- **modeled-not-in-code** → the container is planned but tagged `#built`: retag it `#future`
  (model←code), or it's genuinely missing code → plan it with `write-plan` + `tdd` (code←model).
- **stale-source-path** → the dir moved/renamed: fix the `sourcePath` (model←code).
- **unanchored** → add the `metadata { sourcePath }` the finding suggests.

## Semantic (relationship) pass

The JSON report includes every model relationship (`source`, `target`, `title`, `technology`).
These are runtime integrations (REST, OIDC, NATS, S3) and cannot be derived from `package.json`
(which only captures build-time `@<scope>/*` deps). Verify them heuristically:

1. Resolve the source container's `sourcePath`.
2. Grep it for evidence implied by the edge's `technology`/`title`:
    - OIDC / auth → `@logto/*`, Logto env vars
    - NATS / event bus → a NATS client import, `NATS_URL`
    - S3 / object storage → an S3 client, bucket env vars
    - REST → an HTTP client pointed at the target
3. No evidence ≠ broken. Present as a low-confidence question; the model is an abstraction and may
   legitimately describe intent ahead of code.

## CI wiring

`.github/workflows/architecture-drift.yml` runs on PRs touching `apps/**`, `packages/**`,
`docs/architecture/**`, or `package.json`. It runs `bun arch:drift` and upserts a single sticky PR
comment (marker `<!-- arch-drift -->`). It is **advisory** — `continue-on-error` is not even needed
because the script always exits 0. To make structural drift a hard gate later, have the workflow
read `summary.driftCount` from `--json` and fail when the high-confidence categories are non-empty.

## Extending

- New app → anchor its container (or add one) so the reverse check stays quiet.
- Packages (`packages/**`) are intentionally below container altitude and are not reverse-checked;
  they surface only as relationship evidence.
- To check a second model/project, pass a different `MODEL_DIR` (currently `docs/architecture`).
