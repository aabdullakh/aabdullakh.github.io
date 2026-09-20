---
title: This Site
description: The Astro site you're looking at right now — notes on a few of the more interesting build decisions.
date: 2026-03-01
tags: [astro, typescript, design]
featured: true
cover: ../../assets/projects/project-three-cover.jpg
coverAlt: '[PLACEHOLDER — a screenshot of the homepage]'
repoUrl: https://github.com/PLACEHOLDER/personal-website
---

## What it does

It's a personal site and journal — the one rendering this text. Static, fast, and (hopefully) pleasant to actually read.

## Why I built it

Mostly so I'd have somewhere to put the other two projects on this page. Also because every version of a "build your own site" tutorial I'd seen produced something that looked like a template, and I wanted something that felt like a page out of a book instead.

## How it works

Content is plain Markdown in a typed content collection, so adding a new post is just dropping a file in `src/content/journal/`. The one custom piece of infrastructure is a small [rehype](https://github.com/rehypejs/rehype) plugin that turns ordinary Markdown footnotes into sidenotes that float in the margin on wide screens and collapse into a tap-to-reveal note on mobile — see the [colophon](/colophon/) for the rest of the build notes.

## What I learned

Getting a self-hosted LaTeX-style typeface to actually look right at web sizes took more tuning than I expected — Computer Modern was designed for print at specific point sizes, and it looks noticeably different rendered at arbitrary screen resolutions. Restricting it to headings only, with a more screen-friendly serif for body text, ended up being the right call rather than trying to force it everywhere.
