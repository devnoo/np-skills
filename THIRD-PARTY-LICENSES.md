# Third-party licenses

np-skills bundles skills adapted or redistributed from several upstream
projects. This file records each upstream, its license, the copyright line to
retain, which skills derive from it, and whether the local copy was modified.

All bundled third-party skills are under permissive licenses (MIT or Apache
2.0) and are redistributable **with attribution**. Original skills authored for
this library carry no upstream obligation and are listed separately at the end.

The verbatim license texts live where the obligation attaches:

- **MIT** texts are reproduced once per copyright holder below.
- **Apache 2.0** texts are kept beside the skill that uses them
  (`skills/<skill>/LICENSE` or `LICENSE.txt`), with a `NOTICE` recording
  modifications as Apache §4(b) requires.

---

## obra/superpowers — MIT

- **Repo:** https://github.com/obra/superpowers
- **Copyright:** `Copyright (c) 2025 Jesse Vincent`
- **Skills (adapted):** `brainstorm`, `write-plan`, `code-review`, `tdd`
- **Modified:** yes — adapted to this library's workflow and conventions.

## mattpocock/skills — MIT

- **Repo:** https://github.com/mattpocock/skills
- **Copyright:** `Copyright (c) 2026 Matt Pocock`
- **Skills (adapted):** `grill` (from `grill-me` + `grill-with-docs`),
  `improve-architecture` (from `improve-codebase-architecture`),
  `design-it-twice` (from `improve-codebase-architecture` INTERFACE-DESIGN),
  `adr` (ADR pattern)
- **Skills (redistributed largely verbatim):** `writing-great-skills`
  (+ `GLOSSARY.md`), `diagnosing-bugs`, `handoff`
- **Modified:** mixed — see per-skill notes above.

## addyosmani/web-quality-skills — MIT

- **Repo:** https://github.com/addyosmani/web-quality-skills
- **Copyright:** `Copyright (c) 2026 Addy Osmani`
- **Skills:** `accessibility`, `best-practices`
- **Note:** only these two were included; the upstream `seo`, `core-web-vitals`,
  `performance`, and `web-quality-audit` skills are **not** bundled.
- **Modified:** redistributed as-is.

### MIT License (covers obra, mattpocock, and addyosmani)

> Copyright (c) 2025 Jesse Vincent
> Copyright (c) 2026 Matt Pocock
> Copyright (c) 2026 Addy Osmani
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

---

## cloudflare/security-audit-skill — MIT

- **Repo:** https://github.com/cloudflare/security-audit-skill
- **Copyright:** `Copyright (c) 2025-2026 Cloudflare, Inc.`
- **Skills:** `security-audit`
- **License text:** shipped upstream and retained at `skills/security-audit/LICENSE`.
- **Modified:** redistributed as-is.

## anthropics/skills — Apache License 2.0

- **Repo:** https://github.com/anthropics/skills (skills/frontend-design)
- **Copyright:** Anthropic, PBC.
- **Skills:** `frontend-design`
- **License text:** `skills/frontend-design/LICENSE.txt`
- **Modified:** **yes** — recorded in `skills/frontend-design/NOTICE` per §4(b).
- ⚠️ Only `frontend-design` (and skill-creator-family) skills in that repo are
  Apache 2.0. The `docx`/`pdf`/`pptx`/`xlsx` skills there are proprietary
  ("all rights reserved") and were **not** bundled.

## microsoft/playwright-cli — Apache License 2.0

- **Repo:** https://github.com/microsoft/playwright-cli (skills/playwright-cli)
- **Copyright:** `Copyright (c) Microsoft Corporation.`
- **Skills:** `playwright-cli` (+ `references/`)
- **License text:** `skills/playwright-cli/LICENSE`
- **Modified:** **yes** — recorded in `skills/playwright-cli/NOTICE` per §4(b).

---

## Originally authored for this library (no upstream)

These skills are original to np-skills and carry no third-party obligation:

- `np-orchestrator`, `review-plan`, `design-review`, `build-with-team`
- `likec4`, `verify-architecture` — the LikeC4 architecture-verification check,
  authored by the np-skills maintainer.
- `implement-figma` — **re-authored from scratch** as an independent clean-room
  implementation. An earlier version was adapted from OpenAI's
  `figma-implement-design`, which is governed by the Figma Developer Terms and
  is **not** redistributable; that lineage has been fully removed and the
  current skill ships none of that material.
