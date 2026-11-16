import { loadYaml, formatPeriod, enDashRange } from "./data.mjs";

function esc(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Linkify bare URLs; escape everything else. */
function inlineHtml(text) {
  const s = String(text ?? "");
  return s
    .split(/(https?:\/\/[^\s]+)/g)
    .map((part) =>
      /^https?:\/\//.test(part)
        ? `<a href="${esc(part)}">${esc(part)}</a>`
        : esc(part)
    )
    .join("");
}

function entryHtml({ left, right = "", sub = "", url = "", bullets = [] }) {
  const items = (bullets || [])
    .filter(Boolean)
    .map((b) => `<li>${inlineHtml(b)}</li>`)
    .join("");
  return `
<article class="entry">
  <div class="entry-head">
    <div class="entry-left"><strong>${esc(left)}</strong></div>
    ${right ? `<div class="entry-right">${esc(right)}</div>` : ""}
  </div>
  ${sub ? `<div class="entry-sub"><em>${inlineHtml(sub)}</em></div>` : ""}
  ${url ? `<div class="entry-url"><a href="${esc(url)}">${esc(url)}</a></div>` : ""}
  ${items ? `<ul>${items}</ul>` : ""}
</article>`;
}

function renderEducation(data) {
  return data.entries
    .map((e) =>
      entryHtml({
        left: e.institution,
        right: `${enDashRange(e.start, e.end)} | ${e.location}`,
        sub: e.degree,
        bullets: e.details,
      })
    )
    .join("\n");
}

function renderExperience(data) {
  return data.entries
    .map((e) =>
      entryHtml({
        left: e.title,
        right: formatPeriod(e),
        sub: `${e.organization} | ${e.location}`,
        bullets: e.details,
      })
    )
    .join("\n");
}

function renderProjects(data) {
  return data.entries
    .map((e) =>
      entryHtml({
        left: e.name,
        right: String(e.year),
        sub: e.summary,
        url: e.url,
        bullets: e.details,
      })
    )
    .join("\n");
}

function renderSkills(data) {
  return `<div class="skills">${data.entries
    .map(
      (e) =>
        `<div class="skill-row"><strong>${esc(e.area)}:</strong> ${esc(e.skills)}</div>`
    )
    .join("\n")}</div>`;
}

const RENDERERS = {
  education: renderEducation,
  experience: renderExperience,
  projects: renderProjects,
  skills: renderSkills,
};

function css() {
  // Mirrors the current LaTeX layout (10pt Times, margins, section rules, unbreakable entries)
  return `
@page {
  size: letter;
  margin: 0.3in 0.48in;
}
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  font-family: "Times New Roman", "Liberation Serif", "Nimbus Roman", Times, serif;
  font-size: 10pt;
  line-height: 1.22;
  color: #000;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
a { color: #000; text-decoration: none; }
a:hover { text-decoration: underline; }

.header {
  text-align: center;
  margin: 0 0 0.2em;
}
.header h1 {
  margin: 0 0 0.2em;
  font-size: 1.65em;
  font-weight: 700;
  line-height: 1.1;
}
.header .position {
  margin: 0 0 0.35em;
  font-size: 1.15em;
  font-weight: 400;
  line-height: 1.15;
}
.header .contact {
  font-size: 0.82em;
  line-height: 1.3;
}
.header .sep { margin: 0 0.3em; }
.summary {
  margin: 0.35em 0 0.2em;
  text-align: justify;
}

section {
  margin: 0;
  padding: 0;
}
section h2 {
  margin: 0.75em 0 0.18em;
  padding: 0 0 0.06em;
  font-size: 1em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  border-bottom: 0.5pt solid #000;
  break-after: avoid;
  page-break-after: avoid;
}

.entry {
  margin: 0 0 0.42em;
  break-inside: avoid;
  page-break-inside: avoid;
}
.entry-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75em;
}
.entry-left {
  flex: 1 1 auto;
  min-width: 0;
  font-weight: 700;
}
.entry-right {
  flex: 0 0 auto;
  white-space: nowrap;
  text-align: right;
}
.entry-sub {
  font-style: italic;
  margin: 0;
}
.entry-url {
  font-size: 0.88em;
  margin: 0;
  word-break: break-all;
}
.entry ul {
  margin: 0.1em 0 0;
  padding: 0 0 0 1.05em;
}
.entry li {
  margin: 0.02em 0;
  padding: 0;
}

.skills { margin-top: 0.05em; }
.skill-row { margin: 0 0 0.05em; }

.footer {
  text-align: center;
  font-style: italic;
  margin-top: 0.45em;
}
`.trim();
}

export function renderHtml(manifest) {
  const header = loadYaml(manifest.header);
  const sections = manifest.sections
    .map((sec) => {
      const key = sec.path.replace(/\.ya?ml$/i, "");
      const renderer = RENDERERS[key];
      if (!renderer) throw new Error(`No HTML renderer for ${sec.path}`);
      const data = loadYaml(sec.path);
      return `<section>\n<h2>${esc(sec.title)}</h2>\n${renderer(data)}\n</section>`;
    })
    .join("\n");

  const footer = manifest.footer
    ? `<div class="footer">${esc(manifest.footer)}</div>`
    : "";
  const summary = manifest.summary
    ? `<p class="summary">${esc(String(manifest.summary).trim())}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(header.name)} — CV</title>
<style>${css()}</style>
</head>
<body>
<header class="header">
  <h1>${esc(header.name)}</h1>
  <div class="position">${esc(header.position)}</div>
  <div class="contact">
    ${header.phone ? `${esc(header.phone)}<span class="sep">·</span>` : ""}
    <a href="mailto:${esc(header.email)}">${esc(header.email)}</a><span class="sep">·</span>
    <a href="${esc(header.github_url)}">github.com/${esc(header.github)}</a><span class="sep">·</span>
    <a href="${esc(header.linkedin_url)}">linkedin.com/in/${esc(header.linkedin)}</a>
  </div>
</header>
${summary}
${sections}
${footer}
</body>
</html>`;
}
