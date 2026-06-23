#!/usr/bin/env node

/**
 * Publish via pnpm pack + npm publish to support OIDC trusted publishing.
 *
 * changesets/action calls this as the `publish` command. It replaces
 * `changeset publish` which internally uses `pnpm publish` (no OIDC support).
 *
 * After publishing, creates a git tag so changesets/action can detect the
 * release and create a GitHub release.
 */

import { execSync } from "node:child_process";
import { readFileSync, readdirSync, rmSync } from "node:fs";

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { encoding: "utf-8", stdio: "pipe", ...opts }).trim();
}

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const { name, version } = pkg;
const tag = `${name}@${version}`;

console.log(`Checking if ${tag} is already published...`);

let alreadyPublished = false;
try {
  run(`npm view "${name}@${version}" version`);
  alreadyPublished = true;
} catch {
  // Not on registry — proceed with publish
}

if (alreadyPublished) {
  console.log(`${tag} is already published.`);

  // Ensure the git tag exists so changesets/action can detect the release.
  try {
    run(`git rev-parse -q --verify "refs/tags/${tag}"`);
    console.log(`Git tag ${tag} already exists, nothing to do.`);
  } catch {
    console.log(`Creating missing git tag ${tag}...`);
    run(`git tag "${tag}"`);
  }

  process.exit(0);
}

console.log(`Publishing ${tag}...`);

const tgzBefore = new Set(readdirSync(".").filter((f) => f.endsWith(".tgz")));

run("pnpm pack");

const tgzAfter = readdirSync(".").filter((f) => f.endsWith(".tgz"));
const created = tgzAfter.filter((f) => !tgzBefore.has(f));
if (created.length !== 1) {
  console.error(
    `Expected pnpm pack to produce exactly 1 tarball, found ${created.length}`,
  );
  process.exit(1);
}

const tarball = created[0];

try {
  run(`npm publish "${tarball}" --provenance --access public`);
} finally {
  rmSync(tarball, { force: true });
}

// Create git tag for changesets/action to detect the release
run(`git tag "${tag}"`);

console.log(`Published ${tag}`);
