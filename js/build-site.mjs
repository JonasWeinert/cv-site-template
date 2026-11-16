#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PDF_NAME, PDF_OUT, SITE_OUT } from "./lib/data.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(ROOT, "site");

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run(process.execPath, [join(ROOT, "js/prepare-site-data.mjs")]);

run("npm", ["install", "--no-audit", "--no-fund"], { cwd: SITE });
run("npm", ["exec", "--", "vite", "build", "--outDir", SITE_OUT, "--emptyOutDir"], { cwd: SITE });

if (existsSync(PDF_OUT)) {
  copyFileSync(PDF_OUT, join(SITE_OUT, PDF_NAME));
  console.log(`Copied ${PDF_NAME} → ${SITE_OUT}`);
} else {
  console.warn(`Warning: ${PDF_OUT} not found — run npm run build first for the CV download`);
}
console.log(`Site ready: ${SITE_OUT}`);
