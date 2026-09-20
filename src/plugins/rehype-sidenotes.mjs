// A "rehype" plugin transforms the HTML-ish AST ("hast") produced after
// Markdown is converted from remark's tree. This one runs after the standard
// footnote syntax (`text[^1]` ... `[^1]: note`) has already been turned into
// a `<sup>` reference plus a `<section data-footnotes>` list at the bottom of
// the page — the default GitHub-Flavored-Markdown behavior Astro uses out of
// the box. We rewrite that into "sidenotes": on wide screens CSS floats the
// note into the right margin next to where it's referenced; on narrow screens
// a checkbox + label (no JS needed) lets you tap the number to reveal it
// inline. See src/styles/sidenotes.css for the layout half of this.
import { h } from 'hastscript';
import { visit } from 'unist-util-visit';

export function rehypeSidenotes() {
  return function (tree) {
    /** @type {Map<string, import('hast').ElementContent[]>} */
    const notesById = new Map();

    // 1. Collect every footnote definition's content, keyed by its `id`
    //    (e.g. "fn-1" — see the `clobberPrefix: ''` option in astro.config.mjs),
    //    then delete the trailing footnotes section entirely: its content is
    //    about to move inline as sidenotes instead.
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'section' || !node.properties?.dataFootnotes) return;
      visit(node, 'element', (li) => {
        if (li.tagName !== 'li' || typeof li.properties.id !== 'string') return;
        notesById.set(li.properties.id, stripBackrefs(li.children));
      });
      if (parent && typeof index === 'number') parent.children.splice(index, 1);
    });

    if (notesById.size === 0) return;

    // 2. Replace each inline `<sup><a href="#fn-1" data-footnote-ref>1</a></sup>`
    //    reference with a self-contained sidenote: a visible number, a hidden
    //    checkbox, and the note text — all styled in src/styles/sidenotes.css.
    let counter = 0;
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'sup' || !parent || typeof index !== 'number') return;
      const link = node.children.find((child) => child.type === 'element' && child.tagName === 'a');
      if (!link || link.properties?.dataFootnoteRef === undefined) return;
      const href = typeof link.properties.href === 'string' ? link.properties.href : '';
      const noteContent = notesById.get(href.replace(/^#/, ''));
      if (!noteContent) return;

      counter += 1;
      const checkboxId = `sidenote-${counter}`;
      parent.children[index] = h('span', { class: 'sidenote-wrapper' }, [
        h('label', { for: checkboxId, class: 'sidenote-toggle' }, [
          h('sup', { class: 'sidenote-number' }, String(counter)),
        ]),
        h('input', { type: 'checkbox', id: checkboxId, class: 'sidenote-checkbox' }),
        // `<span>` is inline (phrasing) content, so a block-level `<p>` from
        // the footnote body can't nest inside it validly — unwrap it into its
        // own children instead of keeping the wrapping `<p>`.
        h('span', { class: 'sidenote' }, [
          h('span', { class: 'sidenote-number' }, String(counter)),
          ...unwrapParagraphs(noteContent),
        ]),
      ]);
    });
  };
}

// A footnote-turned-sidenote sits right next to its reference, so it doesn't
// need the "↩ back to reference" link that a bottom-of-page footnote does.
// mdast-util-to-hast appends that link inside the *last paragraph's*
// children — but `state.wrap()` also inserts whitespace-only text nodes
// between block siblings, so that paragraph isn't reliably `nodes.at(-1)`.
// Scan every top-level node's children instead of guessing a position.
function stripBackrefs(nodes) {
  return nodes.map((node) => {
    if (node.type !== 'element' || !Array.isArray(node.children)) return node;

    const children = node.children.filter((child) => child.properties?.dataFootnoteBackref === undefined);
    while (children.length > 0) {
      const tail = children[children.length - 1];
      if (tail.type === 'text' && tail.value.trim() === '') children.pop();
      else break;
    }
    return children.length === node.children.length ? node : { ...node, children };
  });
}

function unwrapParagraphs(nodes) {
  return nodes.flatMap((node) => (node.type === 'element' && node.tagName === 'p' ? node.children : [node]));
}
