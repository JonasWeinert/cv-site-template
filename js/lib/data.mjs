import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, "../..");

// Override with env vars to keep your data outside this repo (e.g. when used as a submodule):
//   CV_DATA=../cv/data CV_OUT=../cv/out npm run build:all
// Relative paths resolve from the current working directory.
export const DATA = process.env.CV_DATA ? resolve(process.env.CV_DATA) : join(ROOT, "data");
export const OUT_DIR = process.env.CV_OUT ? resolve(process.env.CV_OUT) : join(ROOT, "out");
export const SITE_OUT = join(OUT_DIR, "site");

export function loadYaml(relPath) {
  return parseYaml(readFileSync(join(DATA, relPath), "utf8"));
}

export function loadManifest() {
  return loadYaml("cv.yaml");
}

/** Base filename (no extension) for the PDF/HTML/TeX outputs, from cv.yaml `output`. */
export function outputName(manifest = loadManifest()) {
  return manifest.output || "CV";
}

export const PDF_NAME = `${outputName()}.pdf`;
export const PDF_OUT = join(OUT_DIR, PDF_NAME);

export function formatPeriod(entry) {
  const start = [entry.start_month, entry.start_year].filter(Boolean).join(" ").trim();
  const end = [entry.end_month, entry.end_year]
    .filter((x) => x != null && x !== "")
    .join(" ")
    .trim();
  return end ? `${start} – ${end}` : start;
}

export function enDashRange(start, end) {
  return `${start} – ${end}`;
}
