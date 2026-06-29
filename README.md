# np-skills

A personal skill library for Claude Code, oriented around a "build something properly" workflow: brainstorm → grill → plan → review → TDD implement → code review → design review. Roles can run inline or be parallelized as a team.

Behavior is captured once as **Gherkin Given/When/Then scenarios** (Uncle Bob's "Pickled State" — a scenario is a state transition, isomorphic to a test's Arrange/Act/Assert). `grill` authors them in domain language and the user reviews/extends them, `write-plan` carries them into the plan and links each task to scenario IDs, and `tdd` copies each scenario into an acceptance test — so behavior is reviewed once, before any code exists.

Implementation follows **GOOS** (*Growing Object-Oriented Software, Guided by Tests*): a double loop where each scenario is the outer acceptance test that stays red while inner unit cycles drive the design out, starting from a walking skeleton for new surfaces. Scenarios lower into plain tests by default (no Gherkin runtime needed) or into real **Cucumber** `.feature` files when a project opts in — see `skills/tdd/GOOS.md` and `skills/tdd/CUCUMBER.md`.

Optionally, scenarios compose from a per-module **action catalog** (`docs/codemap/actions/<module>.md`) — a curated, extensible vocabulary of Given/When/Then actions that gives reuse and drift-control without a Gherkin runtime. `grill` grows it, `tdd` implements each action once, and `skills/write-plan/check-scenarios.mjs` lints plans against it (advisory — never blocks).

## Layout

```
np-skills/
├── install.sh                # symlinks each skill into ~/.claude/skills/
└── skills/
    ├── np-orchestrator/      # top-level orchestrator
    ├── brainstorm/           # diverge through fuzzy ideas (exploratory only)
    ├── grill/                # relentless interview + writes the spec
    ├── write-plan/           # produces docs/plans/<ts>-<slug>.md
    ├── review-plan/          # collaborative plan review
    ├── adr/                  # docs/adr/NNNN-slug.md for hard-to-reverse choices
    ├── codemap/              # docs/codemap/ — durable project-level reference
    ├── improve-architecture/ # periodic refactor survey (deep-modules vocabulary)
    ├── design-it-twice/      # parallel opposing-mandate sub-agents for design choices
    ├── tdd/                  # red→green→refactor enforcement
    ├── code-review/          # subagent-driven review pass
    ├── implement-figma/      # 1:1 Figma → code
    ├── design-review/        # Playwright vs Figma comparison
    └── build-with-team/      # spawns TeamCreate with the default roles
```

## Install

### Via `npx` (recommended for use)

```sh
npx np-skills                    # interactive: pick global or project
npx np-skills --global           # ~/.claude/skills/  (all projects)
npx np-skills --project          # ./.claude/skills/  (this project only)
npx np-skills --path=<dir>       # custom directory
npx np-skills --keep-existing    # rare: leave already-installed skills alone
```

Files are **copied**, not symlinked — re-run any time to refresh. By default, re-running **overwrites** each skill with the current package contents, so updates land cleanly. Pass `--keep-existing` if you've hand-edited an installed skill and want to protect it.

For a global, every-project install, use `--global`. For a one-off project that needs only some of these skills, use `--project` and then prune.

If you haven't published to npm yet, `npx` works against GitHub too:

```sh
npx github:<user>/np-skills --global
```

### Dev mode (symlink)

If you're editing this repo and want edits to take effect immediately, clone it and use symlinks:

```sh
git clone <repo> ~/np-skills && cd ~/np-skills
./install.sh                              # symlinks to ~/.claude/skills/
# or:
node ./bin/np-skills.js --global --symlink
```

`./install.sh` and `--symlink` produce the same result; the shell script avoids the Node dependency.

## The workflow

`/np-orchestrator <what you want to build>` is the entry point. It walks the chain. You can short-circuit at any step:

| You say | Effect |
|---|---|
| `skip grilling` / `skip brainstorm` | Jump straight to write-plan |
| `review the plan` | Run review-plan after write-plan |
| `use the team` / `with team` | Engage `build-with-team` for parallel execution |
| `no figma` / `backend only` | Skip implement-figma and design-review |

Plans land in `docs/plans/YYYY-MM-DDTHHMMSS-<slug>.md` — the time component prevents merge conflicts across branches. Specs sit alongside as `<ts>-<slug>-spec.md`. ADRs (when warranted) land in `docs/adr/NNNN-slug.md`, sequentially numbered. The optional codemap lives in `docs/codemap/` — run `/codemap init` once per repo and `/codemap update --all` to refresh the `discovered` and `derived` docs.

## Default team

When the team mode is engaged, `build-with-team` spawns:

- **backend-dev** — TypeScript, Vitest, follows `tdd`
- **frontend-dev** — uses `implement-figma`, Playwright for visual checks
- **code-reviewer** — uses `code-review`
- **tester** — designs test cases at unit / integration / E2E levels
- **design-reviewer** — uses `design-review` (Playwright vs Figma)

## Lineage

- `brainstorm`, `write-plan`, `code-review`, `tdd` — adapted from [obra/superpowers](https://github.com/obra/superpowers)
- `grill`, `improve-architecture`, `design-it-twice` — adapted from [mattpocock/skills](https://github.com/mattpocock/skills) (`grill-me`, `grill-with-docs`, `improve-codebase-architecture`)
- `adr`, `codemap` — adapted from the mattpocock/skills ADR pattern and GSD codebase-mapper, with custom mode tags
- `np-orchestrator`, `review-plan`, `design-review`, `implement-figma`, `build-with-team` — original to this library
