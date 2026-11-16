import data from "./generated/data.json";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const THEMES = Object.keys(data.site?.themes || {}).length
  ? Object.keys(data.site.themes)
  : ["modern", "classic", "ledger", "archive", "fieldnote", "journal", "lab", "campus"];

const SWITCHER = data.site?.switcher !== false;

function resolveTheme() {
  const fromData = data.site?.theme || "modern";
  if (!SWITCHER) return fromData;
  const q = new URLSearchParams(location.search).get("theme");
  const saved = localStorage.getItem("cv-theme");
  const t = q || saved || fromData;
  return THEMES.includes(t) ? t : fromData;
}

function getCopy(theme) {
  return data.site?.copy?.[theme] || data.site?.copy?.modern || {};
}

function applyTheme(theme, { persist = true } = {}) {
  document.documentElement.setAttribute("data-theme", theme);
  if (persist && SWITCHER) localStorage.setItem("cv-theme", theme);
  applyCopy(theme);
  const select = $("[data-theme-select]");
  if (select) select.value = theme;
  // Re-run reveal rules for classic/journal (no motion) vs modern
  if (theme === "classic" || theme === "journal" || theme === "ledger") {
    $$("[data-reveal]").forEach((n) => n.classList.add("is-in"));
  }
}

function setText(sel, value) {
  const el = $(sel);
  if (!el) return;
  const text = value == null ? "" : String(value);
  el.textContent = text;
  if (el.classList.contains("eyebrow")) {
    el.hidden = !text.trim();
  }
}

function applyCopy(theme) {
  const copy = getCopy(theme);
  const sections = copy.sections || {};
  const nav = copy.nav || {};

  setText("[data-kicker]", copy.kicker || "");
  setText("[data-tagline]", copy.tagline || data.site.tagline);
  setText("[data-cta-primary]", copy.cta_primary || "Research");
  setText("[data-cta-secondary]", copy.cta_secondary || "CV");
  setText("[data-footer-note]", copy.footer || "");
  const credit = $("[data-footer-credit]");
  if (credit) credit.hidden = data.site?.credit === false;

  setText("[data-copy-research-eyebrow]", sections.research_eyebrow ?? "Research");
  setText("[data-copy-research-title]", sections.research_title ?? "Research");
  setText("[data-copy-experience-eyebrow]", sections.experience_eyebrow ?? "Experience");
  setText("[data-copy-experience-title]", sections.experience_title ?? "Experience");
  setText("[data-copy-projects-eyebrow]", sections.projects_eyebrow ?? "Projects");
  setText("[data-copy-projects-title]", sections.projects_title ?? "Projects");
  setText("[data-copy-education-eyebrow]", sections.education_eyebrow ?? "Education");
  setText("[data-copy-education-title]", sections.education_title ?? "Education");
  setText("[data-copy-contact-eyebrow]", sections.contact_eyebrow ?? "Contact");
  setText("[data-copy-contact-title]", sections.contact_title ?? "Contact");

  setText("[data-nav-research]", nav.research || "Research");
  setText("[data-nav-experience]", nav.experience || "Experience");
  setText("[data-nav-projects]", nav.projects || "Projects");
  setText("[data-nav-education]", nav.education || "Education");
  setText("[data-nav-contact]", nav.contact || "Contact");
  setText("[data-nav-cv]", nav.cv || "CV");
}

function projectBucket(p) {
  const blob = `${p.name} ${p.summary} ${(p.tags || []).join(" ")} ${(p.details || []).join(" ")}`.toLowerCase();
  const buckets = ["all"];
  if (p.featured) buckets.push("featured");
  if (/agent|llm|ml|whisper|genai|langchain|gemini|asr|diarization|pytorch|huggingface/.test(blob)) {
    buckets.push("agents");
  }
  if (/survey|odk|xlsform|streamlit|questionnaire|dataset|mentimeter|poll/.test(blob)) {
    buckets.push("survey");
  }
  return buckets;
}

function renderFocus(items) {
  const root = $("[data-focus]");
  root.innerHTML = items
    .map(
      (f) => `
      <article class="focus-item" data-reveal>
        <h3>${escapeHtml(f.title)}</h3>
        <p>${escapeHtml(f.detail)}</p>
      </article>`
    )
    .join("");
}

function renderExperience(items) {
  const root = $("[data-experience]");
  root.innerHTML = items
    .map((e, i) => {
      const startCollapsed = i >= 3;
      const details = (e.details || [])
        .map((d) => `<li>${escapeHtml(d)}</li>`)
        .join("");
      return `
      <article class="exp-item${startCollapsed ? " is-collapsed" : ""}" data-reveal data-exp>
        <div class="exp-top">
          <h3 class="exp-title">${escapeHtml(e.title)}</h3>
          <span class="exp-when">${escapeHtml(e.when)}</span>
        </div>
        <p class="exp-org">${escapeHtml(e.organization)} · ${escapeHtml(e.location)}</p>
        <ul class="exp-details">${details}</ul>
        ${
          startCollapsed
            ? `<button type="button" class="exp-toggle" data-expand>Show details</button>`
            : ""
        }
      </article>`;
    })
    .join("");

  root.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-expand]");
    if (!btn) return;
    const item = btn.closest("[data-exp]");
    const collapsed = item.classList.toggle("is-collapsed");
    btn.textContent = collapsed ? "Show details" : "Show less";
  });
}

function renderProjects(items) {
  const root = $("[data-projects]");
  root.innerHTML = items
    .map((p) => {
      const buckets = projectBucket(p).join(" ");
      const tags = p.featured
        ? "Featured"
        : (p.tags || []).slice(0, 3).join(" · ") || "Open source";
      const href = p.homepage || p.url;
      return `
      <a class="project" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer"
         data-buckets="${escapeAttr(buckets)}" data-reveal>
        <span class="project-year">${escapeHtml(String(p.year))}</span>
        <div class="project-body">
          <h3>${escapeHtml(p.name)}</h3>
          <p>${escapeHtml(p.summary)}</p>
          <div class="project-meta">${escapeHtml(tags)}</div>
        </div>
        <span class="project-arrow" aria-hidden="true">→</span>
      </a>`;
    })
    .join("");
}

function renderEducation(items) {
  const root = $("[data-education]");
  root.innerHTML = items
    .map((e) => {
      const details = (e.details || [])
        .map((d) => `<li>${escapeHtml(d)}</li>`)
        .join("");
      return `
      <article class="edu-item" data-reveal>
        <div class="edu-top">
          <h3>${escapeHtml(e.institution)}</h3>
          <span class="edu-when">${escapeHtml(`${e.start} – ${e.end}`)} · ${escapeHtml(e.location)}</span>
        </div>
        <p class="edu-degree">${escapeHtml(e.degree)}</p>
        <ul>${details}</ul>
      </article>`;
    })
    .join("");
}

function renderContact(header) {
  const root = $("[data-contact]");
  root.innerHTML = `
    <a href="mailto:${escapeAttr(header.email)}">${escapeHtml(header.email)}</a>
    <a href="${escapeAttr(header.github_url)}" target="_blank" rel="noopener noreferrer">GitHub</a>
    <a href="${escapeAttr(header.linkedin_url)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
    <a href="./${escapeHtml(data.cvPdf)}" download>Curriculum vitae (PDF)</a>
  `;
}

function renderHeroContact(header) {
  const root = $("[data-hero-contact]");
  if (!root) return;
  root.innerHTML = `
    <a href="mailto:${escapeAttr(header.email)}">${escapeHtml(header.email)}</a>
    <a href="${escapeAttr(header.github_url)}" target="_blank" rel="noopener noreferrer">GitHub</a>
    <a href="${escapeAttr(header.linkedin_url)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
    <a href="./${escapeHtml(data.cvPdf)}" download>CV</a>
  `;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function setupFilters() {
  const buttons = $$("[data-filter]");
  const projects = $$("[data-projects] .project");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      buttons.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      projects.forEach((p) => {
        const buckets = (p.dataset.buckets || "").split(/\s+/);
        p.classList.toggle("is-hidden", filter !== "all" && !buckets.includes(filter));
      });
    });
  });
}

function setupNav() {
  const nav = $("[data-nav]");
  const toggle = $("[data-nav-toggle]");
  const links = $$("[data-nav-menu] a[href^='#']");

  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  links.forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
    })
  );

  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const sections = ["research", "experience", "projects", "education", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach((a) => {
          a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`);
        });
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0.01 }
  );
  sections.forEach((s) => spy.observe(s));
}

function setupReveal() {
  const nodes = $$("[data-reveal]");
  if (document.documentElement.getAttribute("data-theme") === "classic") {
    nodes.forEach((n) => n.classList.add("is-in"));
    return;
  }
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  nodes.forEach((n) => io.observe(n));
  $$(".hero [data-reveal]").forEach((n) => n.classList.add("is-in"));
}

function setupScrollCue() {
  $("[data-scroll-next]")?.addEventListener("click", () => {
    document.getElementById("research")?.scrollIntoView({ behavior: "smooth" });
  });
}

function setupThemeSwitch() {
  const select = $("[data-theme-select]");
  if (!select || !SWITCHER) return;
  $("[data-theme-switch]").hidden = false;

  select.innerHTML = THEMES.map((id) => {
    const label = data.site?.themes?.[id]?.label || id;
    return `<option value="${id}">${escapeHtml(label)}</option>`;
  }).join("");

  select.value = resolveTheme();
  select.addEventListener("change", () => {
    const theme = select.value;
    applyTheme(theme);
    const url = new URL(location.href);
    url.searchParams.set("theme", theme);
    history.replaceState({}, "", url);
  });
}

function hydrate() {
  const theme = resolveTheme();
  document.documentElement.setAttribute("data-theme", theme);

  $("[data-name]").textContent = data.header.name;
  $("[data-hero-name]").textContent = data.header.name;
  $("[data-role]").textContent = data.header.position;
  $("[data-affiliation]").textContent = data.site.affiliation || "";
  $("[data-about]").textContent = data.site.about;
  $("[data-year]").textContent = `© ${new Date().getFullYear()}`;

  document.title = `${data.header.name} — ${data.header.position}`;

  applyTheme(theme, { persist: false });
  renderFocus(data.site.research_focus);
  renderExperience(data.experience);
  renderProjects(data.projects);
  renderEducation(data.education);
  renderContact(data.header);
  renderHeroContact(data.header);

  setupFilters();
  setupNav();
  setupReveal();
  setupScrollCue();
  setupThemeSwitch();
}

hydrate();
