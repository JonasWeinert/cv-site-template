import { writeFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { loadYaml, loadManifest, formatPeriod, enDashRange, outputName, OUT_DIR } from "./data.mjs";

function escapeLatex(text) {
  return String(text ?? "")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([{}$&#%_])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function formatInline(text) {
  const s = String(text ?? "");
  return s
    .split(/(https?:\/\/[^\s]+)/g)
    .map((part) => (/^https?:\/\//.test(part) ? `\\url{${part}}` : escapeLatex(part)))
    .join("");
}

function cventry(bodyLines) {
  return ["\\cventry{", ...bodyLines, "}"].join("\n");
}

function entryBlock({ left, right = "", sub = "", url = "", bullets = [] }) {
  const lines = [
    "\\noindent\\begin{tabularx}{\\textwidth}{@{}>{\\raggedright\\arraybackslash}X r@{}}",
    `\\textbf{${escapeLatex(left)}}${right ? ` & ${escapeLatex(right)}` : " & "} \\\\`,
    "\\end{tabularx}",
  ];
  if (sub) lines.push(`\\textit{${formatInline(sub)}}`);
  if (url) lines.push(`\\\\[-0.05em]\\footnotesize\\url{${url}}`);
  if (bullets?.length) {
    lines.push("\\vspace{0.12em}", "\\begin{itemize}");
    for (const b of bullets) lines.push(`  \\item ${formatInline(b)}`);
    lines.push("\\end{itemize}");
  }
  return cventry(lines);
}

function renderHeader(header) {
  return [
    "\\begin{center}",
    `{\\LARGE\\bfseries ${escapeLatex(header.name)}}\\\\[0.25em]`,
    `{\\large ${escapeLatex(header.position)}}\\\\[0.35em]`,
    "{\\footnotesize",
    ...(header.phone ? [`${escapeLatex(header.phone)} \\,$\\cdot$\\,`] : []),
    `\\href{mailto:${header.email}}{${escapeLatex(header.email)}} \\,$\\cdot$\\,`,
    `\\href{${header.github_url}}{github.com/${escapeLatex(header.github)}} \\,$\\cdot$\\,`,
    `\\href{${header.linkedin_url}}{linkedin.com/in/${escapeLatex(header.linkedin)}}`,
    "}",
    "\\end{center}",
    "\\vspace{0.2em}",
  ].join("\n");
}

const RENDERERS = {
  education: (s) =>
    s.entries
      .map((e) =>
        entryBlock({
          left: e.institution,
          right: `${enDashRange(e.start, e.end).replace(/–/g, "--")} | ${e.location}`,
          sub: e.degree,
          bullets: e.details,
        })
      )
      .join("\n\n"),
  experience: (s) =>
    s.entries
      .map((e) =>
        entryBlock({
          left: e.title,
          right: formatPeriod(e).replace(/–/g, "--"),
          sub: `${e.organization} | ${e.location}`,
          bullets: e.details,
        })
      )
      .join("\n\n"),
  projects: (s) =>
    s.entries
      .map((e) =>
        entryBlock({
          left: e.name,
          right: String(e.year),
          sub: e.summary,
          url: e.url,
          bullets: e.details,
        })
      )
      .join("\n\n"),
  skills: (s) =>
    s.entries
      .map(
        (e) =>
          `\\noindent\\textbf{${escapeLatex(e.area)}:} ${escapeLatex(e.skills)}\\\\[0.05em]`
      )
      .join("\n"),
};

function preamble() {
  return String.raw`\documentclass[10pt]{article}
\usepackage{fontspec}
\setmainfont{Times New Roman}
\usepackage{enumitem}
\usepackage{tabularx}
\usepackage{array}
\usepackage{xurl}
\usepackage[hidelinks]{hyperref}
\usepackage{titlesec}
\usepackage{microtype}
\usepackage{needspace}
\usepackage[left=0.48in,right=0.48in,top=0.3in,bottom=0.3in]{geometry}
\titlespacing*{\section}{0pt}{0.85em}{0.2em}
\titleformat{\section}{\normalsize\bfseries\uppercase}{\thesection}{0em}{}[{\vspace{0.08em}\titlerule[0.5pt]}]
\setlist[itemize]{leftmargin=1.05em, itemsep=0.03em, parsep=0pt, topsep=0pt, partopsep=0pt}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0.05em}
\setlength{\emergencystretch}{2.5em}
\Urlmuskip=0mu plus 2mu
\raggedbottom
\renewcommand{\baselinestretch}{0.98}\selectfont
\newcommand{\cventry}[1]{\par\nobreak\Needspace{8\baselineskip}\noindent\begin{minipage}[t]{\textwidth}#1\end{minipage}\par\addvspace{0.55em}}
\begin{document}
`;
}

export function buildTex(manifest) {
  const header = loadYaml(manifest.header);
  const parts = [preamble(), renderHeader(header), ""];
  if (manifest.summary) parts.push(escapeLatex(String(manifest.summary).trim()), "\\vspace{0.4em}", "");
  for (const sec of manifest.sections) {
    const key = sec.path.replace(/\.ya?ml$/i, "");
    const renderer = RENDERERS[key];
    if (!renderer) throw new Error(`No TeX renderer for ${sec.path}`);
    parts.push(`\\section*{${escapeLatex(sec.title)}}`, renderer(loadYaml(sec.path)), "");
  }
  if (manifest.footer) {
    parts.push(
      "\\vspace{0.4em}",
      "\\begin{center}",
      `\\textit{${escapeLatex(manifest.footer)}}`,
      "\\end{center}"
    );
  }
  parts.push("\\end{document}");
  return parts.join("\n");
}

export function compileTexPdf() {
  const manifest = loadManifest();
  const name = outputName(manifest);
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `${name}.tex`), buildTex(manifest), "utf8");

  const result = spawnSync(
    "xelatex",
    ["-interaction=nonstopmode", "-halt-on-error", `${name}.tex`],
    { cwd: OUT_DIR, encoding: "utf8" }
  );
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error("xelatex failed — install MacTeX/TeX Live, or use: npm run build");
  }
  for (const ext of [".aux", ".log", ".out"]) {
    const p = join(OUT_DIR, `${name}${ext}`);
    if (existsSync(p)) unlinkSync(p);
  }
  console.log(`Wrote ${join(OUT_DIR, `${name}.pdf`)} (via xelatex)`);
}
