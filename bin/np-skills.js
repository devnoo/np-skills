#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const readline = require("node:readline/promises");

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const SKILLS_SRC = path.join(PACKAGE_ROOT, "skills");

const args = process.argv.slice(2);
const flags = {
  global: args.includes("--global"),
  project: args.includes("--project"),
  symlink: args.includes("--symlink"),
  keepExisting: args.includes("--keep-existing"),
  help: args.includes("--help") || args.includes("-h"),
};

const pathArgRaw = args.find((a) => a.startsWith("--path="));
const customPath = pathArgRaw ? pathArgRaw.slice("--path=".length) : null;

const HOMEDIR_SKILLS = path.join(os.homedir(), ".claude", "skills");
const PROJECT_SKILLS = path.resolve(".claude", "skills");

function printHelp() {
  console.log(`
np-skills — install Claude Code skills

Usage:
  npx np-skills                       Interactive — pick global or project
  npx np-skills --global              Install to ~/.claude/skills/
  npx np-skills --project             Install to ./.claude/skills/
  npx np-skills --path=<dir>          Install to a custom directory
  npx np-skills --global --symlink    Symlink (dev mode) instead of copy
  npx np-skills --keep-existing       Skip skills already present (rare; default is overwrite)

Locations:
  global   ${HOMEDIR_SKILLS}
  project  ${PROJECT_SKILLS}

Notes:
  --symlink is only meaningful when the package is at a stable path (e.g. a
  cloned repo). Run via 'npx' from npm fetches into a temp dir and symlinks
  would break; --symlink is rejected in that case.
`);
}

async function promptTarget() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log("Where should np-skills be installed?\n");
  console.log(`  1) global   ${HOMEDIR_SKILLS}`);
  console.log(`  2) project  ${PROJECT_SKILLS}`);
  console.log("");
  const answer = (await rl.question("Choose 1 or 2 [1]: ")).trim() || "1";
  rl.close();
  if (answer === "1" || answer.toLowerCase() === "global") return HOMEDIR_SKILLS;
  if (answer === "2" || answer.toLowerCase() === "project") return PROJECT_SKILLS;
  console.error(`Invalid choice: ${answer}`);
  process.exit(1);
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(srcPath, destPath);
    else if (entry.isFile()) fs.copyFileSync(srcPath, destPath);
  }
}

function isInsideNpxCache(p) {
  return p.includes(path.sep + "_npx" + path.sep) || p.includes("/.npm/_npx/");
}

function installOne(name, target, mode) {
  const src = path.join(SKILLS_SRC, name);
  const dest = path.join(target, name);

  let existed = false;
  let isLink = false;
  try {
    const st = fs.lstatSync(dest);
    existed = true;
    isLink = st.isSymbolicLink();
  } catch (_) {
    // dest doesn't exist — fall through
  }

  if (existed) {
    if (flags.keepExisting && !isLink) {
      console.log(`  keep: ${name} (already present)`);
      return false;
    }
    if (isLink) fs.unlinkSync(dest);
    else fs.rmSync(dest, { recursive: true, force: true });
  }

  if (mode === "symlink") {
    fs.symlinkSync(src, dest);
    console.log(`  ${existed ? "relink" : "link  "}: ${name} -> ${src}`);
  } else {
    copyRecursive(src, dest);
    console.log(`  ${existed ? "update" : "copy  "}: ${name}`);
  }
  return true;
}

async function main() {
  if (flags.help) {
    printHelp();
    return;
  }

  if (!fs.existsSync(SKILLS_SRC)) {
    console.error(`Skills source directory not found: ${SKILLS_SRC}`);
    process.exit(1);
  }

  let target;
  if (customPath) target = path.resolve(customPath);
  else if (flags.global) target = HOMEDIR_SKILLS;
  else if (flags.project) target = PROJECT_SKILLS;
  else target = await promptTarget();

  let mode = flags.symlink ? "symlink" : "copy";
  if (mode === "symlink" && isInsideNpxCache(PACKAGE_ROOT)) {
    console.error(
      "Refusing --symlink: package is inside an npx cache directory and the symlinks would break when the cache is cleaned. Re-run without --symlink, or clone the repo and run the CLI from there.",
    );
    process.exit(1);
  }

  fs.mkdirSync(target, { recursive: true });

  const skills = fs
    .readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  console.log(
    `\nInstalling ${skills.length} skill${skills.length === 1 ? "" : "s"} to ${target} (${mode})...\n`,
  );

  let installed = 0;
  for (const name of skills) {
    if (installOne(name, target, mode)) installed++;
  }

  console.log(
    `\nDone. ${installed}/${skills.length} skill${skills.length === 1 ? "" : "s"} installed.`,
  );
  if (mode === "symlink") {
    console.log(
      "Edits to the source files take effect immediately (these are symlinks).",
    );
  } else {
    console.log("Re-run to update.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
