# cv-site-template

Write your CV once in YAML; get a print-ready **PDF** and a single-page **personal site** with eight themes. Default builds need **Node only** (no R, no LaTeX).

- PDF rendered with Playwright from HTML/CSS (optional XeLaTeX route)
- Static site built with Vite: sticky nav, scroll spy, project filters, expandable experience
- One GitHub Actions workflow builds both and deploys to GitHub Pages

## Quick start

1. Click **Use this template** (or fork), then edit the YAML in `data/`.
2. Settings → Pages → Source: **GitHub Actions**.
3. Push to `main`. The site appears at `https://<you>.github.io/<repo>/` with the PDF next to it.

Locally:

```bash
npm install
npm run build          # PDF → out/<output>.pdf
npm run build:site     # site → out/site
npm run build:all      # both
npm run dev:site       # live site on http://localhost:5173
```

Optional: `npm run build:tex` (needs XeLaTeX).

## Data (`data/`)

| File | Used by |
|------|---------|
| `cv.yaml` | Manifest: output filename, optional summary, section files and order |
| `header.yaml` | Name, position, contact links (`phone` optional) |
| `about.yaml` | Tagline, about text, meta description, focus areas |
| `copy.yaml` | Per-theme site wording (nav labels, section titles) |
| `education.yaml` / `experience.yaml` / `projects.yaml` / `skills.yaml` | CV + site (`projects.more` = site-only extras) |
| `site.yaml` | Theme, theme switcher on/off, footer credit on/off |

## Keeping your data in another repo

The code reads data from `CV_DATA` and writes to `CV_OUT` when set (relative to the current directory), so you can keep this repo as a git submodule and your YAML elsewhere:

```bash
git submodule add https://github.com/JonasWeinert/cv-site-template.git cv-template
cd cv-template && npm ci
CV_DATA=../cv/data CV_OUT=../cv/out npm run build:all
```

[JonasWeinert/jonasweinert](https://github.com/JonasWeinert/jonasweinert) is a working example: its workflow builds from the submodule and publishes to a separate `*.github.io` repo.

## Themes

Set `theme:` in `data/site.yaml`. With `switcher: true`, visitors can also switch in the footer or via `?theme=lab`. With `switcher: false`, the site is locked to `theme` and the dropdown is hidden.

| Theme | Feel |
|-------|------|
| `modern` | Mist/ink landing page |
| `classic` | Traditional academic page |
| `ledger` | Working-paper two-column memo |
| `archive` | Soft archive shelf, stamped sections |
| `fieldnote` | Field notebook + timeline |
| `journal` | Essay / article with drop cap |
| `lab` | Dark README-style lab index |
| `campus` | Calm institutional profile |

## License

MIT
