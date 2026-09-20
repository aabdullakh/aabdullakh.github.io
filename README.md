# [PLACEHOLDER Name]'s personal site

A personal portfolio + journal, built with [Astro](https://astro.build) and TypeScript. Plain CSS, self-hosted fonts, no Tailwind, no client framework.

## Running locally

```sh
npm install
npm run dev
```

The site is at `http://localhost:4321`. `npm run build` produces a static build in `dist/`; `npm run preview` serves that build locally so you can sanity-check it before deploying. `npm run astro check` type-checks the whole project (including `.astro` files).

## Project structure

```
src/
├── content/
│   ├── journal/       # one .md file per journal entry
│   └── projects/      # one .md file per project
├── content.config.ts  # the zod schemas those files are validated against
├── components/        # small reusable pieces (cards, nav, theme toggle, …)
├── layouts/            # page chrome (BaseLayout) + entry-specific layouts
├── pages/               # routes — file path = URL
├── plugins/             # the two small custom remark/rehype plugins
├── lib/                 # date formatting, content-fetching helpers
└── styles/               # plain CSS: tokens, fonts, sidenotes, print
```

## Adding a journal entry

Drop a new Markdown file into `src/content/journal/`, e.g. `src/content/journal/my-new-post.md`:

```md
---
title: My new post
date: 2026-04-01
description: One sentence describing what this is about.
tags: [some-tag]
---

Whatever you want to say.
```

The filename becomes the URL slug (`my-new-post` → `/journal/my-new-post/`). Required fields are `title`, `date`, and `description`; `tags` defaults to an empty list, and `draft: true` hides an entry from listings, RSS, and the sitemap in production builds (`npm run dev` still shows drafts, so you can preview them). If you edit an old entry later, add an `updated: 2026-05-01` date and it'll show alongside the original date.

Get a frontmatter field wrong — a typo like `dat:` instead of `date:`, or a `date` that isn't a real date — and the dev server / build will fail with a clear error pointing at the file and field, instead of silently breaking the page.

## Adding a project

Same idea, in `src/content/projects/`:

```md
---
title: My Project
description: One sentence describing it.
date: 2026-04-01
tags: [typescript]
featured: true
repoUrl: https://github.com/you/my-project
liveUrl: https://my-project.example.com
---

## What it does
## Why I built it
## How it works
## What I learned
```

`featured: true` makes it eligible for the homepage's "Things I've built" section (it shows up to 4). `cover` is optional — if you have a real screenshot, add it as `cover: ../../assets/projects/my-project-cover.jpg` (the image needs to live under `src/assets/`, not `public/`, so Astro can optimize it: resize, convert to WebP, etc.). Skip `cover` entirely and the project card falls back to a plain `</>` placeholder — or embed an inline SVG diagram directly in the body (see the next section).

## Math

Journal entries support LaTeX math via [KaTeX](https://katex.org). Inline: `$e^{i\pi} + 1 = 0$`. Block:

```md
$$
f(x) = \int_{-\infty}^{\infty} \hat f(\xi)\, e^{2\pi i x \xi} \, d\xi
$$
```

## Sidenotes

Standard Markdown footnote syntax becomes a sidenote automatically — no special syntax needed:

```md
Some claim that needs a citation.[^1]

[^1]: Here's the actual note.
```

On wide screens it floats in the right margin next to the paragraph it's attached to; on narrow screens it collapses into a tap-to-reveal note (a checkbox + label, so it works with JavaScript disabled). The conversion happens in `src/plugins/rehype-sidenotes.mjs`, which rewrites the ordinary footnotes Astro's Markdown pipeline already generates — if you ever want real bottom-of-page footnotes instead, just remove `rehypeSidenotes` from `astro.config.mjs`.

## Making an SVG diagram

Draw it as plain inline SVG directly in a project's Markdown body (see `src/content/projects/project-one.md` for a working example) — Astro passes raw HTML through in Markdown, so no special handling is needed. Two things make a diagram fit the site: use `stroke="currentColor"` (or a scoped `<style>` block referencing `var(--color-ink)` / `var(--color-accent)`) so it adapts to dark mode automatically, and keep strokes thin (`stroke-width: 1.5`–`2`) to match the line-drawing style used elsewhere.

## Changing colors and fonts

Colors are CSS custom properties in `src/styles/global.css` — light mode is set on `:root`, dark mode under `:root[data-theme='dark']` and the matching `prefers-color-scheme: dark` block right below it (keep those two in sync if you change one). The important ones:

```css
--color-bg      /* page background */
--color-ink     /* body text */
--color-accent  /* the one accent color — section numbers, links, tags */
```

Fonts are declared in the same file as `--font-heading` (Latin Modern Roman), `--font-body` (Source Serif 4), and `--font-mono` (JetBrains Mono, used for all UI chrome — nav, tags, dates, code). Source Serif 4 and JetBrains Mono are [Fontsource](https://fontsource.org) packages imported in `src/layouts/BaseLayout.astro`; add a different weight by importing another `@fontsource/<name>/<weight>.css` file there. Latin Modern Roman is hand-declared in `src/styles/fonts.css` pointing at the `.woff2` files in `public/fonts/latin-modern-roman/` (sourced from the [GUST Font License](https://www.gust.org.pl/projects/e-foundry/latin-modern) release — see the `LICENSE.txt` next to them). Swapping any of these three families just means changing the `@font-face`/`@fontsource` imports and the matching `--font-*` variable — nothing else references a font by name directly.

## Deploying

The build is fully static (`output: 'static'`, the Astro default) — no server runtime is required, so both of these are free tiers with no extra configuration beyond what's already in this repo.

**Netlify** — `netlify.toml` at the repo root already sets the build command and publish directory. Push to GitHub, then in Netlify: **Add new site → Import an existing project**, pick the repo, and click deploy — it reads `netlify.toml` automatically.

**Vercel** — no config file needed; Vercel auto-detects Astro. Push to GitHub, then **Add New… → Project** in the Vercel dashboard, import the repo, and deploy with the defaults.

**Custom domain**, either platform: buy the domain wherever you like, then in the site's dashboard go to **Domain settings → Add a domain**, enter it, and add the DNS records the dashboard shows you (usually an `A`/`ALIAS` record at the registrar for the root domain, and a `CNAME` for `www`). Both platforms provision HTTPS automatically once DNS resolves — this can take anywhere from a few minutes to a few hours depending on your registrar.

One more thing to do once you have a real domain: update `site: 'https://example.com'` in `astro.config.mjs` to your actual domain — it's what the sitemap, RSS feed, and Open Graph tags use to build absolute URLs.
