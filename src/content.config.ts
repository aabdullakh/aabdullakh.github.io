// Astro's Content Layer API: `glob()` loads a folder of Markdown files into a
// typed collection, and `defineCollection` + a Zod schema validate every file's
// frontmatter at build time. A typo like `dat:` instead of `date:` fails the
// build with a clear error instead of silently breaking a page.
// Docs: https://docs.astro.build/en/guides/content-collections/
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    // Bumped whenever an old entry gets a meaningful edit; shown as "updated" on the page.
    updated: z.date().optional(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    // Draft posts are filtered out of listings/RSS in production (see src/lib/content.ts).
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  // The schema can be a function of `{ image }` — Astro's helper for validating
  // an image path and handing it to <Image> for optimization (resizing, format
  // conversion, etc). Projects without a raster cover just omit the field and
  // use an inline SVG diagram in the write-up instead.
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.date(),
      tags: z.array(z.string()).default([]),
      // Featured projects surface on the home page.
      featured: z.boolean().default(false),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      repoUrl: z.url().optional(),
      liveUrl: z.url().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { journal, projects };
