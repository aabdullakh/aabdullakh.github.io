// @ts-check
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

import { rehypeSidenotes } from './src/plugins/rehype-sidenotes.mjs';
import { remarkReadingTime } from './src/plugins/remark-reading-time.mjs';

// https://astro.build/config
export default defineConfig({
  // Used to generate absolute URLs for the sitemap, RSS feed, and canonical/OG tags.
  // This is a GitHub Pages user site, served from the domain root, so no `base` is set.
  site: 'https://aabdullakh.github.io',

  integrations: [sitemap()],

  markdown: {
    // Astro 7 defaults to a native, faster processor ("Sätteri") that doesn't
    // support arbitrary remark/rehype plugins. Math and sidenotes need real
    // remark/rehype plugins, so we opt back into the classic unified pipeline.
    processor: unified({
      remarkPlugins: [remarkMath, remarkReadingTime],
      rehypePlugins: [rehypeKatex, rehypeSidenotes],
      remarkRehype: {
        // Default footnote ids are prefixed "user-content-"; dropping that
        // keeps ids short (`fn-1`) and matches what rehype-sidenotes expects.
        clobberPrefix: '',
      },
    }),
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      wrap: true,
    },
  },
});
