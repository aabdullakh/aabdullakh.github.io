import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getJournalEntries } from '../lib/content';

export async function GET(context: APIContext) {
  const entries = await getJournalEntries();
  return rss({
    title: '[PLACEHOLDER Name]',
    description: "Notes on what I'm building, learning, and thinking about.",
    site: context.site!,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: `/blog/${entry.id}/`,
    })),
    customData: '<language>en-us</language>',
  });
}
