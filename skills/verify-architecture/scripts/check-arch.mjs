#!/usr/bin/env node
// Architecture drift checker — compares the LikeC4 model against the real
// Bun/Turborepo workspace. Structural drift only (deterministic). Semantic
// relationship checking is left to the agent (see ../SKILL.md).
//
//   node check-arch.mjs            # human-readable markdown report
//   node check-arch.mjs --json     # machine-readable JSON (for the agent / CI)
//
// Always exits 0 — this is advisory. Use the report's `summary.driftCount`
// to decide whether to act.

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MODEL_DIR = "docs/architecture";

// Provenance tags drive how strict the existence check is:
//   built    — source we own  → MUST map to a workspace
//   offshelf — software we run but don't author → optional (verify sourcePath if given)
//   managed  — Scaleway managed service        → optional
//   future   — planned, not yet built          → skipped entirely
const REQUIRES_CODE = "built";
const SKIP_TAG = "future";

function repoRoot() {
	return execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
}

// Export the *computed* model as JSON via the LikeC4 CLI (robust — no DSL parsing).
function loadModel(root) {
	const out = join(mkdtempSync(join(tmpdir(), "arch-")), "model.json");
	execFileSync("bunx", ["likec4", "export", "json", MODEL_DIR, "-o", out], { cwd: root, stdio: "pipe" });
	return JSON.parse(readFileSync(out, "utf8"));
}

// Real workspaces, classified. apps/* are container-altitude (reverse-checked);
// everything else is library/infra (used only to resolve sourcePath, never flagged).
function loadWorkspaces(root) {
	const apps = [];
	const others = [];
	const appsDir = join(root, "apps");
	if (existsSync(appsDir)) {
		for (const name of readdirSync(appsDir)) {
			const dir = `apps/${name}`;
			if (statSync(join(root, dir)).isDirectory() && existsSync(join(root, dir, "package.json"))) apps.push(dir);
		}
	}
	return { apps, others };
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function containers(model) {
	return Object.values(model.elements ?? {})
		.filter((e) => e.kind === "container")
		.map((e) => ({
			id: e.id,
			title: e.title ?? e.id,
			tags: e.tags ?? [],
			sourcePath: e.metadata?.sourcePath ?? null,
		}));
}

function diff(model, ws, root) {
	const findings = [];
	const claimed = new Set(); // apps a container points at

	for (const c of containers(model)) {
		if (c.tags.includes(SKIP_TAG)) continue;
		const requires = c.tags.includes(REQUIRES_CODE);

		if (c.sourcePath) {
			claimed.add(c.sourcePath);
			if (!existsSync(join(root, c.sourcePath))) {
				findings.push({
					kind: "stale-source-path",
					confidence: "high",
					container: c.id,
					detail: `sourcePath '${c.sourcePath}' does not exist on disk`,
				});
			}
			continue;
		}

		// No anchor — try to match a built container to an app by normalized name.
		if (requires) {
			const match = ws.apps.find((a) => norm(a.split("/").pop()) === norm(c.id) || norm(a.split("/").pop()) === norm(c.title));
			if (match) {
				claimed.add(match);
				findings.push({
					kind: "unanchored",
					confidence: "medium",
					container: c.id,
					detail: `#built container matched '${match}' by name; add metadata { sourcePath '${match}' } to anchor it`,
				});
			} else {
				findings.push({
					kind: "modeled-not-in-code",
					confidence: "high",
					container: c.id,
					detail: `#built container '${c.title}' has no sourcePath and no app dir matches its name`,
				});
			}
		}
	}

	// Reverse: apps with no container claiming them.
	for (const app of ws.apps) {
		if (claimed.has(app)) continue;
		findings.push({
			kind: "code-not-in-model",
			confidence: "high",
			app,
			detail: `workspace '${app}' is not represented by any container in the model`,
		});
	}

	return findings;
}

function relationships(model) {
	return Object.values(model.relations ?? {}).map((r) => ({
		source: r.source?.model,
		target: r.target?.model,
		title: r.title ?? "",
		technology: r.technology ?? "",
	}));
}

function main() {
	const root = repoRoot();
	const model = loadModel(root);
	const ws = loadWorkspaces(root);
	const findings = diff(model, ws, root);
	const report = {
		summary: {
			driftCount: findings.length,
			apps: ws.apps.length,
			containers: containers(model).length,
		},
		findings,
		// Runtime integrations the agent should verify heuristically (not done here).
		relationships: relationships(model),
	};

	if (process.argv.includes("--json")) {
		process.stdout.write(JSON.stringify(report, null, 2) + "\n");
		return;
	}

	const byKind = {};
	for (const f of findings) (byKind[f.kind] ??= []).push(f);
	const lines = [`# Architecture drift report`, ``, `**${findings.length} structural finding(s)** · ${report.summary.containers} containers · ${report.summary.apps} apps`, ``];
	if (!findings.length) lines.push(`✅ Model and workspace are structurally aligned.`);
	for (const [kind, fs] of Object.entries(byKind)) {
		lines.push(`## ${kind} (${fs.length})`);
		for (const f of fs) lines.push(`- **${f.container ?? f.app}** — ${f.detail} _(confidence: ${f.confidence})_`);
		lines.push(``);
	}
	lines.push(`> Runtime relationships (REST/OIDC/NATS/S3) are not checked here — run the \`verify-architecture\` skill interactively for the semantic pass.`);
	process.stdout.write(lines.join("\n") + "\n");
}

main();
