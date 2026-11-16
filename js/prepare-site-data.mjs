#!/usr/bin/env node
/**
 * Assemble site data from YAML into site/src/generated/data.json
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { ROOT, PDF_NAME, loadYaml as load } from "./lib/data.mjs";

const OUT = join(ROOT, "site/src/generated/data.json");

function formatPeriod(e) {
  const start = [e.start_month, e.start_year].filter(Boolean).join(" ").trim();
  const end = [e.end_month, e.end_year]
    .filter((x) => x != null && x !== "")
    .join(" ")
    .trim();
  return end ? `${start} – ${end}` : start;
}

const manifest = load("cv.yaml");
const header = load(manifest.header || "header.yaml");
const about = load(manifest.about || "about.yaml");
const copy = load(manifest.copy || "copy.yaml");
const site = load("site.yaml");
const education = load("education.yaml");
const experience = load("experience.yaml");
const projects = load("projects.yaml");
const skills = load("skills.yaml");

const featured = projects.entries.map((p) => ({
  name: p.name,
  summary: p.summary,
  year: p.year,
  url: p.url,
  details: p.details || [],
  featured: true,
  tags: [],
}));

const more = (projects.more || []).map((p) => ({
  ...p,
  details: p.details || [],
  featured: false,
  tags: p.tags || [],
}));

const payload = {
  generatedAt: new Date().toISOString(),
  header,
  site: {
    theme: site.theme || "modern",
    themes: site.themes || {},
    // switcher: false locks the site to `theme` (no footer dropdown, ignores ?theme=)
    switcher: site.switcher !== false,
    tagline: about.tagline,
    description: about.description || `${header.name} — ${header.position}`,
    about: String(about.about || "").trim(),
    affiliation: about.affiliation || "",
    research_focus: about.research_focus || [],
    copy,
  },
  education: education.entries,
  experience: experience.entries.map((e) => ({
    title: e.title,
    organization: e.organization,
    location: e.location,
    when: formatPeriod(e),
    details: e.details || [],
  })),
  projects: [...featured, ...more],
  skills: skills.entries,
  cvPdf: PDF_NAME,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log(`Wrote ${OUT}`);
