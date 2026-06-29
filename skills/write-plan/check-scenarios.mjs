#!/usr/bin/env node
// check-scenarios — advisory linter for plan/spec scenarios against the per-module
// action catalogs under docs/codemap/actions/.
//
// It NEVER fails the build: it prints findings and always exits 0. The point is to
// surface (a) scenario steps that don't match any catalogued action — drift, or a
// new action that should be added — and (b) catalogued actions no scenario uses yet.
//
// Usage:
//   node check-scenarios.mjs                 # scan docs/plans/**.md + docs/codemap/actions/**.md
//   node check-scenarios.mjs path/to/plan.md # check a single plan/spec file
//
// No dependencies. Node >= 18.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PLANS_DIR = path.join(ROOT, "docs", "plans");
const ACTIONS_DIR = path.join(ROOT, "docs", "codemap", "actions");

const KEYWORD = /^\s*(Given|When|Then|And|But)\b\s*/i;

function walk(dir, pred) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, pred));
    else if (e.isFile() && pred(p)) out.push(p);
  }
  return out;
}

// Turn a catalogue action ("a registered user \"<name>\"") into a matcher regex.
// <param> placeholders and any quoted literal become wildcards.
function actionToRegex(action) {
  const escaped = action
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // escape regex metachars
    .replace(/<[^>]+>/g, ".+?") // <name>, <n>, <amount> → wildcard
    .replace(/"\.\+\?"/g, '"[^"]*"') // a quoted <param> → any quoted literal
    .replace(/\s+/g, "\\s+");
  return new RegExp("^" + escaped + "$", "i");
}

// Strip the Given/When/Then/And/But keyword and trailing punctuation from a step.
function bareStep(line) {
  return line.replace(KEYWORD, "").replace(/[.;,\s]+$/, "").trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return d[m][n];
}

// Collect catalogued actions: lines that are list items under a Given/When/Then heading.
function loadCatalog() {
  const actions = []; // { text, regex, module, used: false }
  for (const file of walk(ACTIONS_DIR, (p) => p.endsWith(".md"))) {
    const mod = path.basename(file, ".md");
    for (const raw of fs.readFileSync(file, "utf8").split("\n")) {
      const m = raw.match(/^\s*[-*]\s+(.*\S)\s*$/);
      if (!m) continue;
      const text = m[1].replace(/`/g, "").trim();
      // skip "Implemented by" mapping lines (contain "→")
      if (text.includes("→") || text.includes("->")) continue;
      actions.push({ text, regex: actionToRegex(text), module: mod, used: false });
    }
  }
  return actions;
}

// Extract scenario steps from a plan/spec file's `## Scenarios` section.
function extractSteps(file) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const steps = [];
  let inScenarios = false;
  lines.forEach((line, i) => {
    if (/^##\s+/.test(line)) inScenarios = /^##\s+Scenarios\b/i.test(line);
    if (!inScenarios) return;
    if (KEYWORD.test(line)) steps.push({ raw: line.trim(), bare: bareStep(line), line: i + 1 });
  });
  return steps;
}

function main() {
  const arg = process.argv[2];
  const planFiles = arg
    ? [path.resolve(arg)]
    : walk(PLANS_DIR, (p) => p.endsWith(".md"));

  const catalog = loadCatalog();
  if (catalog.length === 0) {
    console.log("check-scenarios: no action catalogs found under docs/codemap/actions/.");
    console.log("  (Advisory only — author catalogs via grill, or skip if you're not using them.)");
    return;
  }

  let unknown = 0;
  for (const file of planFiles) {
    const steps = extractSteps(file);
    const misses = [];
    for (const step of steps) {
      const hit = catalog.find((a) => a.regex.test(step.bare));
      if (hit) { hit.used = true; continue; }
      // nearest catalogued action by edit distance for a suggestion
      let best = null, bestD = Infinity;
      for (const a of catalog) {
        const d = levenshtein(step.bare.toLowerCase(), a.text.toLowerCase());
        if (d < bestD) { bestD = d; best = a; }
      }
      const near = best && bestD <= Math.max(6, best.text.length * 0.4)
        ? `  ~ closest: "${best.text}" (${best.module})`
        : "  (no close match — likely a new action to add)";
      misses.push(`  ${path.relative(ROOT, file)}:${step.line}  ${step.raw}\n${near}`);
    }
    if (misses.length) {
      unknown += misses.length;
      console.log(`\n⚠ ${path.relative(ROOT, file)} — ${misses.length} step(s) not in any catalog:`);
      misses.forEach((m) => console.log(m));
    }
  }

  const unused = catalog.filter((a) => !a.used);
  if (unused.length) {
    console.log(`\nℹ ${unused.length} catalogued action(s) used by no scenario yet:`);
    unused.forEach((a) => console.log(`  - "${a.text}" (${a.module})`));
  }

  console.log(
    `\ncheck-scenarios: ${unknown} unmatched step(s), ${unused.length} unused action(s) across ` +
    `${planFiles.length} file(s). Advisory — nothing blocked.`,
  );
}

main();
