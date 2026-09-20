// Small helpers shared by the journal and project index/listing pages, so the
// "hide drafts in production" and "newest first" rules live in one place.
import { getCollection, type CollectionEntry } from 'astro:content';

export async function getJournalEntries() {
  const entries = await getCollection('journal', ({ data }) => import.meta.env.PROD ? !data.draft : true);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getProjects() {
  const entries = await getCollection('projects', ({ data }) => import.meta.env.PROD ? !data.draft : true);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function groupByYear<T extends { data: { date: Date } }>(entries: T[]): [number, T[]][] {
  const byYear = new Map<number, T[]>();
  for (const entry of entries) {
    const year = entry.data.date.getFullYear();
    const group = byYear.get(year);
    if (group) group.push(entry);
    else byYear.set(year, [entry]);
  }
  return [...byYear.entries()].sort((a, b) => b[0] - a[0]);
}

export function uniqueTags<T extends { data: { tags: string[] } }>(entries: T[]): string[] {
  return [...new Set(entries.flatMap((entry) => entry.data.tags))].sort((a, b) => a.localeCompare(b));
}

export type JournalEntry = CollectionEntry<'journal'>;
export type ProjectEntry = CollectionEntry<'projects'>;
