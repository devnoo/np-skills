---
name: implement-figma
description: Build production frontend code from a Figma node with faithful visual parity, expressed in the project's own design system. Use when the user gives a Figma URL or live selection, or asks to "implement this design", "build this component", or "match this mockup". Pairs with design-review for Playwright-based visual verification.
---

# implement-figma

Turn a Figma node into code a maintainer would have written by hand — code that matches the design *and* belongs in the codebase. Two obligations pull against each other, and the whole skill is about holding both at once:

- The **design system is the single source of truth for values.** You ship its tokens and components — never raw hex, px, or a one-off element when a catalogued one exists.
- The Figma node is the **visual baseline** you must reproduce.

When they disagree, the SSOT wins on consistency and the eye wins on fidelity: take the token, then adjust the immediate margin/padding so the rendered result still lands on the design. Resolve the conflict in code, not by abandoning the token.

## What to gather first

| Input | Where it comes from |
|---|---|
| The node | A `figma.com/design/...?node-id=A-B` URL, or the live selection if the user has Figma's Dev Mode MCP connected. Convert the URL's `node-id=A-B` to the `A:B` form the tools expect; branch URLs carry a branch key that later calls need. |
| The design system | The project's tokens, theme, and component library. If `docs/codemap/` exists, read `CONVENTIONS.md` and the token/component locations from it. No design system? Say so — you'll be shipping raw values and that's a finding, not a default. |
| Target framework | Whatever the project uses. The MCP's returned markup is a *representation* to translate, never code to paste. |
| Where it renders | The route or story that will show the component, so `design-review` can drive it later. |

If any of these is missing, ask before writing code.

## The pipeline

### 1 — Acquire

Pull the design as data, not as a picture you eyeball:

- Fetch the node's structured context (layout, type, fills, spacing, hierarchy). If the payload is truncated, fetch the node's metadata, then walk and fetch its children individually.
- Pull the variable/token definitions the node references — these are your bridge to the design system in the next stage.
- If Code Connect is set up, fetch the node→component mapping; it tells you which existing components the design already expects.
- Capture the node screenshot and save its path. This is the **baseline** `design-review` will regress the implementation against — do not skip it.

Never assume a value you could fetch. Guessing a color or gap you could have read is how drift starts.

### 2 — Map to the design system

Before writing markup, translate every raw value the MCP handed you into the project's vocabulary:

- Raw colors → theme/token colors. Raw spacing → the spacing scale. Raw type → the type ramp.
- Bespoke elements → existing components when one fits. Search the codebase before building anything new — reuse beats recreation.
- Real exported assets → used directly. Never substitute an icon-library glyph for a Figma-exported icon, hand-redraw an SVG Figma already exported, or drop in a placeholder "for now".

What survives this stage as a raw literal should be only what the design system genuinely has no slot for — and each such case is worth a one-line note.

### 3 — Reproduce, region by region

Work the node area by area rather than all-at-once, checking each region as you go:

- **Structure** — flex/grid/positioning that matches the node's layout, not just its look at one width.
- **Type** — family, size, weight, line-height, letter-spacing.
- **Color** — background, border, text, across every state.
- **State** — hover, focus, active, disabled, loading; the design's state variants are part of the spec, not extras.
- **Responsive** — reproduce the behavior at each breakpoint the design defines; capture each one.
- **Assets** — placed and sized as exported.
- **Accessibility** — semantic elements, alt text, and ARIA where the design implies a pattern the bare markup wouldn't convey.

### 4 — Verify

Self-check before declaring done — then hand off, don't self-approve:

- [ ] Side-by-side against the baseline at every breakpoint — name what differs.
- [ ] Every interactive state implemented and matching the design's state variants.
- [ ] Tokens used wherever the design system has them; each surviving raw value justified.
- [ ] Assets are the exported originals, not substitutes.
- [ ] Accessibility checked.

Then hand to `design-review` for the Playwright visual-regression pass. Fidelity is its call to confirm, not yours to assert.

## Never

- **Don't paste the MCP's markup as final code.** It's a representation; translate it into the project's framework and tokens.
- **Don't invent fidelity.** If the Figma is low-fidelity or incomplete, stop and ask — improvising the missing parts produces a design nobody approved.
- **Don't write tests here.** Tests come from the plan and run through `tdd`.
- **Don't approve your own output.** `design-review` owns the verdict; a component can be clean code and still fail the visual regression.
