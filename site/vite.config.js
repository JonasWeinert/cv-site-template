import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DATA_JSON = resolve(__dirname, "src/generated/data.json");

// Fills %CV_*% placeholders in index.html from the generated data, so the
// name, meta description, PDF link and theme lock are right before JS runs.
function cvHtml() {
  return {
    name: "cv-html",
    transformIndexHtml(html) {
      const data = JSON.parse(readFileSync(DATA_JSON, "utf8"));
      const esc = (s) =>
        String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const values = {
        CV_NAME: esc(data.header.name),
        CV_DESCRIPTION: esc(data.site.description),
        CV_PDF: esc(data.cvPdf),
        CV_THEME: data.site.theme,
        CV_THEMES: JSON.stringify(Object.keys(data.site.themes || {})),
        CV_SWITCHER: JSON.stringify(data.site.switcher),
      };
      return html.replace(/%(CV_[A-Z]+)%/g, (m, key) => values[key] ?? m);
    },
  };
}

export default defineConfig({
  root: ".",
  base: "./",
  publicDir: "public",
  plugins: [cvHtml()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
    open: false,
  },
  resolve: {
    alias: {
      "@data": DATA_JSON,
    },
  },
});
