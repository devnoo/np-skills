# np-skills

A personal skill library for Claude Code, oriented around a "build something properly" workflow: brainstorm → grill → plan → review → TDD implement → code review → design review. Roles can run inline or be parallelized as a team.

Most of these skills are adapted from, or straight copies of, other people's work — see **Lineage & attribution** below.

Behavior is captured once as **Gherkin Given/When/Then scenarios** (Uncle Bob's "Pickled State" — a scenario is a state transition, isomorphic to a test's Arrange/Act/Assert). `grill` authors them in domain language and the user reviews/extends them, `write-plan` carries them into the plan and links each task to scenario IDs, and `tdd` copies each scenario into an acceptance test — so behavior is reviewed once, before any code exists.

Implementation follows **GOOS** (*Growing Object-Oriented Software, Guided by Tests*): a double loop where each scenario is the outer acceptance test that stays red while inner unit cycles drive the design out, starting from a walking skeleton for new surfaces. Scenarios lower into plain tests by default (no Gherkin runtime needed) or into real **Cucumber** `.feature` files when a project opts in — see `skills/tdd/GOOS.md` and `skills/tdd/CUCUMBER.md`.

## Layout

```
np-skills/
├── install.sh                # symlinks each skill into ~/.claude/skills/
├── THIRD-PARTY-LICENSES.md   # attribution + licenses for bundled upstream skills
└── skills/
    # ── core build workflow ────────────────────────────────
    ├── np-orchestrator/      # top-level orchestrator
    ├── brainstorm/           # diverge through fuzzy ideas (exploratory only)
    ├── grill/                # relentless interview + writes the spec
    ├── write-plan/           # produces docs/plans/<ts>-<slug>.md
    ├── review-plan/          # collaborative plan review
    ├── adr/                  # docs/adr/NNNN-slug.md for hard-to-reverse choices
    ├── improve-architecture/ # periodic refactor survey (deep-modules vocabulary)
    ├── design-it-twice/      # parallel opposing-mandate sub-agents for design choices
    ├── tdd/                  # red→green→refactor enforcement
    ├── code-review/          # subagent-driven review pass (drift detection)
    ├── implement-figma/      # Figma → code with visual parity
    ├── design-review/        # Playwright visual-regression vs Figma
    ├── build-with-team/      # spawns TeamCreate with the default roles
    # ── architecture verification ──────────────────────────
    ├── likec4/               # author/maintain a LikeC4 architecture model
    ├── verify-architecture/  # check code against the LikeC4 model
    # ── web quality & frontend (bundled, see lineage) ──────
    ├── accessibility/        # WCAG 2.2 / Lighthouse a11y
    ├── best-practices/       # Lighthouse best-practices
    ├── frontend-design/      # frontend design guidance
    ├── security-audit/       # security review pass
    ├── playwright-cli/       # drive the playwright-cli browser tool
    # ── diagnostics & meta (bundled, see lineage) ──────────
    ├── diagnosing-bugs/      # feedback-loop-first debugging discipline
    ├── handoff/              # compact a session into a handoff doc
    └── writing-great-skills/ # vocabulary + principles for authoring skills
```

## Default team

When the team mode is engaged, `build-with-team` spawns:

- **backend-dev** — TypeScript, Vitest, follows `tdd`
- **frontend-dev** — uses `implement-figma`, Playwright for visual checks
- **code-reviewer** — uses `code-review`
- **tester** — designs test cases at unit / integration / E2E levels
- **design-reviewer** — uses `design-review` (Playwright vs Figma)

## Licensing

The original skills in this library — and the repo's own scripts and docs — are
**MIT © Job Denoo** (see [`LICENSE`](LICENSE)). Several skills are adapted or
redistributed from third-party projects and **remain under their own licenses**
(all permissive — MIT or Apache 2.0); the root LICENSE does not relicense them.
Per-upstream terms, copyright lines, and modification notices live in
[`THIRD-PARTY-LICENSES.md`](THIRD-PARTY-LICENSES.md), with each bundled skill's
`LICENSE`/`NOTICE` kept in its own directory.

## Lineage & attribution

Every bundled third-party skill is under a permissive license (MIT or Apache
2.0) and redistributed with attribution. Full per-upstream terms, copyright
lines, and modification notices are in [`THIRD-PARTY-LICENSES.md`](THIRD-PARTY-LICENSES.md).

**Original to this library** (authored by the np-skills maintainer):

- `np-orchestrator`, `review-plan`, `design-review`, `build-with-team`
- `likec4`, `verify-architecture` — the LikeC4 architecture-verification check
- `implement-figma` — an independent, clean-room implementation (an earlier
  version derived from OpenAI's Figma skill was removed; see the licenses file)

**Adapted from [obra/superpowers](https://github.com/obra/superpowers)** — MIT © Jesse Vincent:

- `brainstorm`, `write-plan`, `code-review`, `tdd`

**Adapted from [mattpocock/skills](https://github.com/mattpocock/skills)** — MIT © Matt Pocock:

- `grill` (`grill-me` + `grill-with-docs`), `improve-architecture`
  (`improve-codebase-architecture`), `design-it-twice` (INTERFACE-DESIGN), `adr`
- redistributed largely verbatim: `diagnosing-bugs`, `handoff`,
  `writing-great-skills`

**Bundled from other upstreams** (see the licenses file for each):

- `accessibility`, `best-practices` — [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills), MIT © Addy Osmani (only these two were included)
- `security-audit` — [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill), MIT © Cloudflare, Inc.
- `frontend-design` — [anthropics/skills](https://github.com/anthropics/skills), Apache 2.0 (modified)
- `playwright-cli` — [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli), Apache 2.0 (modified)
