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

The site is hosted on [GitHub Pages](https://pages.github.com) as a user site at `https://aabdullakh.github.io`. The build is fully static (`output: 'static'`, the Astro default), so no server runtime is needed.

Deployment is handled by `.github/workflows/deploy.yml`: every push to `main` runs the official [`withastro/action`](https://github.com/withastro/action) to install dependencies and build the site, then [`actions/deploy-pages`](https://github.com/actions/deploy-pages) publishes `dist/`. You can also trigger a deploy manually from the repo's **Actions** tab (**Deploy to GitHub Pages → Run workflow**).

One-time setup: in the repo on GitHub, go to **Settings → Pages**, and under **Build and deployment → Source** choose **GitHub Actions**.

Because this is a user site (repo named `aabdullakh.github.io`), it's served from the domain root, so `astro.config.mjs` sets `site` but no `base`, and root-relative links like `/journal/` work as-is. If you ever move the site to a project repo (served from `https://aabdullakh.github.io/<repo>/`), you'd need to add `base: '/<repo>'` and prefix internal links with `import.meta.env.BASE_URL`.

**Custom domain** (optional): in **Settings → Pages → Custom domain**, enter the domain and save, then add the DNS records GitHub shows you at your registrar (`A`/`AAAA` records for an apex domain, or a `CNAME` pointing at `aabdullakh.github.io` for a subdomain like `www`). Also add a `public/CNAME` file containing the domain so it survives each deploy, tick **Enforce HTTPS** once the certificate is issued, and update `site` in `astro.config.mjs` and the `Sitemap:` line in `public/robots.txt` to the new domain.
