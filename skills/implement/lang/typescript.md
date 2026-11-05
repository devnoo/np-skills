# TypeScript

Sniff first; the project's own scripts win over these defaults.

## Commands

| Check | Look for | Default |
|---|---|---|
| Package manager | lockfile: `bun.lock`, `pnpm-lock.yaml`, `package-lock.json` | match the lockfile |
| Typecheck | `typecheck` script, `turbo typecheck` | `tsc --noEmit` |
| Single test | `vitest.config.*` / `jest.config.*` | `vitest run <file>` |
| Full suite | `test` script, `turbo test` | `vitest run` |
| Lint | `lint` script, `biome.json`, `eslint.config.*` | project script only |
| E2E | `playwright.config.*` | `playwright test` |

In a monorepo, scope runs with the workspace filter (`turbo --filter`, `pnpm --filter`, `bun --filter`) while building; run unfiltered in the Gate.

## Renames and moves (rule 4)

- Find every reference before renaming: `tsc --noEmit` after the rename is the source of truth; grep for string uses (`"oldName"`, dynamic keys, test titles) that the compiler can't see.
- A move updates imports only. Keep the project's import style (path aliases, `index.ts` barrels, `.js` suffixes) — don't introduce a new one.
- **Stop and ask** before renaming anything that crosses a process boundary: exported package API, HTTP route, event/message name, DB column, env var, CLI flag.

## Clean-code idioms

- No `any`; use `unknown` + narrowing. No new `@ts-ignore` / `@ts-expect-error` / `eslint-disable`.
- Model states with discriminated unions, not optional-field bags or boolean flags.
- Validate at the boundary (schema lib the project already uses — zod, valibot, Effect Schema); trust types inside.
- Prefer `readonly` and `const`; no mutation of arguments.
- Follow the project's error style (throw, `Result`, Effect errors) — don't mix.
- Named exports unless the project uses defaults.
