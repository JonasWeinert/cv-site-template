#!/usr/bin/env node
/**
 * Default build: YAML → HTML/CSS → PDF via Playwright (no R, no LaTeX).
 * Optional: npm run build:tex  (requires xelatex)
 * Optional: npm run build:r    (requires R)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { loadManifest, outputName, OUT_DIR, PDF_OUT } from "./lib/data.mjs";
import { renderHtml } from "./lib/render-html.mjs";

async function buildPdf() {
  const manifest = loadManifest();
  mkdirSync(OUT_DIR, { recursive: true });

  const html = renderHtml(manifest);
  const htmlPath = join(OUT_DIR, `${outputName(manifest)}.html`);
  writeFileSync(htmlPath, html, "utf8");
  console.log(`Wrote ${htmlPath}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
    await page.pdf({
      path: PDF_OUT,
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    console.log(`Wrote ${PDF_OUT}`);
  } finally {
    await browser.close();
  }
}

const mode = process.argv[2];
if (mode === "--tex") {
  const { compileTexPdf } = await import("./lib/render-tex.mjs");
  compileTexPdf();
} else {
  await buildPdf();
}
