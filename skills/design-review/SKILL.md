---
name: design-review
description: Compare a frontend implementation against its Figma source by capturing screenshots with Playwright and diffing them against the Figma screenshot. Use after implement-figma to verify visual fidelity, or when the user asks for a "design review", "design QA", "pixel check", or "Figma vs prod" comparison. Pairs with implement-figma.
---

# design-review

## What this skill does

This is a **visual regression** check — with one twist: the baseline is the Figma design itself, not a previously-approved screenshot. Runs the implementation in a real browser via Playwright, captures the **candidate** screenshots at the breakpoints the design specifies, and diffs each against the Figma baseline. Returns a structured delta: what matches, what differs, severity per delta.

## Inputs

| Input | Source |
|---|---|
| Figma reference screenshot(s) | Saved by `implement-figma` step 3 (`get_screenshot`). |
| Live URL of the implementation | The local dev server (`pnpm dev` or equivalent) at the route showing the component. |
| Breakpoints to check | From the Figma file — typically the design defines 1–3 viewport widths. |
| Component selector | The DOM selector or route that isolates the component being reviewed. |

If any of these is missing, ask before proceeding.

## Process

### 1. Boot the implementation

- Start the dev server in the background (`pnpm dev` or the project equivalent) and wait for the port to be ready.
- Navigate to the route showing the component.

### 2. Capture the candidate screenshots

These are the **candidate** images visual regression diffs against the Figma baseline. Use Playwright. Two modes:

**Playwright CLI** (preferred for reproducibility):

```sh
pnpm exec playwright test design-review.spec.ts
```

The spec file (created if not present) iterates over the configured viewports and screenshots the target selector:

```ts
import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  test(`design-review ${vp.name}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto(process.env.REVIEW_URL!);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(process.env.REVIEW_SELECTOR!)).toHaveScreenshot(`${vp.name}.png`);
  });
}
```

**Playwright MCP** (preferred for interactive states): drive the browser, hover/focus/active each interactive element, screenshot per state.

### 3. Diff against Figma

For each candidate screenshot, run the regression against its baseline:

- Open the corresponding Figma baseline from step 3 of `implement-figma`.
- Compare visually. Categorize differences:
  - **Critical** — wrong layout, missing element, wrong content, wrong color on brand surfaces.
  - **Important** — spacing off by more than 4px, typography mismatch, wrong weight, broken responsive behavior, missing interactive state.
  - **Minor** — sub-pixel rendering differences, anti-aliasing, font hinting, scrollbar variance.

If pixel-diff tooling is available in the project (e.g. `pixelmatch`, `playwright`'s built-in `toHaveScreenshot` with thresholds), use it as the visual-regression backstop — but human-eye categorization still leads.

### 4. Report

Return findings in the three-category structure used by `code-review`:

```
## Critical
- desktop: header logo is left-aligned in impl, centered in Figma. Fix: change `justify-content` on `.site-header` to `center`.

## Important
- mobile: card padding is 12px in impl, 16px in Figma. Fix: bump `--card-padding` to `space-4`.

## Minor
- desktop: button shadow blur 8px vs Figma 6px — barely visible.

## Summary
<2-3 sentences>
```

Save the implementation screenshots and the diff report under `docs/plans/<plan-ts>-design-review/`.

### 5. Loop until clean

If Critical or Important findings exist, hand them back to `implement-figma` (or to the frontend-dev role in team mode). After fixes, re-run this skill. Keep looping until only Minor findings remain — those the user decides.

## What this skill does NOT do

- Does not fix the implementation. It only reports.
- Does not approve "close enough" without the user's call.
- Does not replace `code-review` — they're orthogonal. A component can pass code-review and fail design-review.
