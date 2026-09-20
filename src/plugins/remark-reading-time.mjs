// A "remark" plugin transforms the Markdown AST before it becomes HTML.
// This one walks the parsed document, counts words, and stashes an estimated
// reading time onto the page's frontmatter so `<ReadingTime data={...} />`
// components can use it without recomputing it on every render.
import { toString } from 'mdast-util-to-string';
import getReadingTime from 'reading-time';

export function remarkReadingTime() {
  return function (tree, { data }) {
    const text = toString(tree);
    const stats = getReadingTime(text);
    data.astro.frontmatter.minutesRead = stats.text;
  };
}
