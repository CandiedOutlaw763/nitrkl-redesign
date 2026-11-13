# NIT Rourkela website: complete redesign

The whole of [www.nitrkl.ac.in](https://www.nitrkl.ac.in/) rebuilt in the new design from
[kriteshmantry/nitrdesign_km](https://github.com/kriteshmantry/nitrdesign_km): every institute page, every
department and centre site, faculty profiles, directories, curricula, all subject syllabi, seminars, publications
and photo galleries, with the official content, in the new home page's header, menus and footer.

The site is static. Everything that is deployed is in [`nitrkl/`](nitrkl/).

## What is in it

| | |
|---|---|
| Pages | about 1,020 official pages, each at its official address (`/Institute/FormerDirectors/`, `/Academic/AcademicRegulations/`, `/CS/`, `/LS/~surajit/` …) |
| Records | about 5,500 records the official site serves with query strings (seminars, publications, curricula, galleries, directories) and all 3,644 subject syllabi, at their official addresses too (`/Academic/Syllabus/?id=23&sid=8214`) |
| Documents | about 5,900 linked PDFs and other files, each link labelled with its format and size, for example *(PDF, 693 KB)* |
| Search | a site search over every page and syllabus (`/Search/`) |
| Sitemap | every page, grouped by section (`/Sitemap/`) |

## Design and guidelines

The inner pages extend the home page's design system rather than inventing a new one:

- **DBIM 3.0**: Cinnamon Red key colour and its shades, Noto Sans (with Devanagari and Odia), the six-size type
  scale (H1 36 / H2 24 / H3 20 / P1 16 / P2 14 / 12), left-aligned text, line icons from one set, the national
  emblems and government links in the footer, the institute name in English, Hindi and Odia.
- **GIGW 3.0 / WCAG 2.1 AA**: skip link, landmarks, one H1 per page and ordered headings, breadcrumbs, visible
  focus, keyboard-operable menus and accordions, 4.5:1 text contrast, tables with header cells and their own
  scroll box (no page-wide horizontal scroll at 320px), file type and size on document links, a warning on links
  that leave the website, accessibility controls (text size, spacing, contrast, dyslexia font), Hindi and Odia
  through the language menu, print styles, the sitemap, search, last-reviewed date, and reduced motion respected.

Components the official content is rebuilt into: page band with a campus photograph and breadcrumb, section menu
(the department's own menu on department sites), *On this page* contents for long pages, people cards with a
filter for long directories, faculty profile header (photo, role, contacts, ORCID / Scopus / Scholar links,
figures), document tiles, accordions, figures, galleries, maps and data tables.

## How it is built

The pages are generated from the official site by the scripts in [`tools/`](tools/):

```bash
python tools/crawl.py cache                 # crawl www.nitrkl.ac.in (HTML pages)
python tools/fetch_extra.py cache           # query-string records, syllabi, pages that were rate-limited
python tools/build.py cache nitrkl site     # first pass: writes doclinks.json and imglinks.json
python tools/docsizes.py cache              # file sizes for the document links
python tools/images.py cache                # content images as WebP
python tools/build.py cache nitrkl site     # final build into site/
```

`build.py` takes the redesign's inner page (`screen-reader-access.html`) as the template, cleans each official
page into the components above (styles in `tools/assets/inner.css`, behaviour in `tools/assets/inner.js`) and
writes the finished site, which is then copied into `nitrkl/`. `tools/a11y.py` runs axe-core over pages and
`tools/shots.py` takes screenshots for review.

## Run it locally

```bash
npx serve nitrkl
```

## Notes

- Content is as published on www.nitrkl.ac.in in November 2026. Every page links to the official page it came from.
- Images are copies of the official images, converted to WebP. Documents (PDFs) stay on www.nitrkl.ac.in; about
  1,170 document links on the official site already return *not found*, and are shown as they are.
- A few official pages are separate applications (vendor registration, e-procurement, the CVO's complaint portal);
  their links go to the official site.
