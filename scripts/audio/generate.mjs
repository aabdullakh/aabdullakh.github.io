// Turns every blog post into an MP3 that the "Listen" player on the post plays.
//
// Voice: Kokoro-82M (Apache-2.0), an open-source text-to-speech model, run
// locally with kokoro-js. No API key, no paid service.
//
// Usage (from the site root):  npm run audio
//
// Writes:
//   public/audio/<slug>.mp3    the narration
//   src/data/audio.json        per post: file, duration, and when each paragraph
//                              starts (so the page can highlight what's being read)
//
// Posts whose text hasn't changed since their MP3 was made are skipped, so
// only new or edited posts cost any time.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Mp3Encoder } from '@breezystack/lamejs';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

// ---- Settings ---------------------------------------------------------------
const VOICE = process.env.TTS_VOICE || 'am_michael'; // see VOICES.md in kokoro-js for others
const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const DTYPE = 'q8';
const KBPS = 48; // speech sounds clean at 48 kbps mono (~0.35 MB per minute)
const GAP_SENTENCE = 0.12; // seconds of silence between sentences
const GAP_PARAGRAPH = 0.45; // ...and between paragraphs and headings
const MAX_CHUNK = 260; // characters per synthesis call
const VERSION = 2; // bump to force every post to be regenerated
// -----------------------------------------------------------------------------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const POSTS_DIR = path.join(ROOT, 'src/content/journal');
const AUDIO_DIR = path.join(ROOT, 'public/audio');
const MANIFEST = path.join(ROOT, 'src/data/audio.json');

// ---------- Markdown -> list of spoken blocks ----------

function inlineText(node) {
  switch (node.type) {
    case 'text':
    case 'inlineCode':
      return node.value;
    case 'break':
      return ' ';
    case 'image':
    case 'imageReference':
    case 'footnoteReference':
    case 'inlineMath':
    case 'html':
      return '';
    default:
      return (node.children || []).map(inlineText).join('');
  }
}

const clean = (s) => s.replace(/\s+/g, ' ').trim();

/** The same key is computed in the browser to find the paragraph on the page. */
export const blockKey = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40);

function extractBlocks(markdown) {
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(markdown);
  const blocks = [];
  let prevWasImage = false;

  const isImageOnly = (p) => p.children.every((c) => c.type === 'image' || (c.type === 'text' && !c.value.trim()));
  const isCaption = (p) => p.children.length === 1 && p.children[0].type === 'emphasis';

  const walk = (node) => {
    switch (node.type) {
      case 'heading': {
        const text = clean(inlineText(node));
        if (text) blocks.push({ text: /[.!?:]$/.test(text) ? text : text + '.', key: blockKey(text) });
        prevWasImage = false;
        return;
      }
      case 'paragraph': {
        if (isImageOnly(node)) return void (prevWasImage = true);
        if (prevWasImage && isCaption(node)) return void (prevWasImage = false); // image caption: skip
        prevWasImage = false;
        const text = clean(inlineText(node));
        if (text) blocks.push({ text, key: blockKey(text) });
        return;
      }
      case 'listItem': {
        // A simple list item is one block; a list item containing paragraphs or
        // sub-lists is read child by child (same as the page's markup).
        const simple = node.children.length === 1 && node.children[0].type === 'paragraph';
        if (simple) {
          const text = clean(inlineText(node.children[0]));
          if (text) blocks.push({ text: /[.!?:]$/.test(text) ? text : text + '.', key: blockKey(text) });
        } else node.children.forEach(walk);
        prevWasImage = false;
        return;
      }
      case 'root':
      case 'list':
      case 'blockquote':
        node.children.forEach(walk);
        return;
      default:
        // code, table, math, html, thematicBreak, footnoteDefinition, ... are not read
        prevWasImage = false;
    }
  };
  walk(tree);
  return blocks;
}

function splitText(text) {
  const sentences = text.match(/[^.!?]+(?:[.!?]+["'”’)\]]*|$)/g) || [text];
  const pieces = [];
  let current = '';
  for (let s of sentences.map((x) => x.trim()).filter(Boolean)) {
    while (s.length > MAX_CHUNK) {
      let cut = Math.max(s.lastIndexOf(', ', MAX_CHUNK), s.lastIndexOf('; ', MAX_CHUNK));
      if (cut < 40) cut = s.lastIndexOf(' ', MAX_CHUNK);
      if (cut < 1) cut = MAX_CHUNK;
      if (current) pieces.push(current), (current = '');
      pieces.push(s.slice(0, cut + 1).trim());
      s = s.slice(cut + 1).trim();
    }
    if (current && current.length + s.length + 1 > MAX_CHUNK) pieces.push(current), (current = '');
    current = current ? current + ' ' + s : s;
  }
  if (current) pieces.push(current);
  return pieces;
}

// ---------- Audio helpers ----------

function trimSilence(a, rate) {
  const threshold = 0.01;
  const pad = Math.round(rate * 0.03);
  let s = 0;
  let e = a.length - 1;
  while (s < a.length && Math.abs(a[s]) < threshold) s++;
  while (e > s && Math.abs(a[e]) < threshold) e--;
  if (s >= e) return a;
  return a.subarray(Math.max(0, s - pad), Math.min(a.length, e + pad));
}

function encodeMp3(samples, rate) {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  const enc = new Mp3Encoder(1, rate, KBPS);
  const parts = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const buf = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (buf.length) parts.push(Buffer.from(buf.buffer, buf.byteOffset, buf.length));
  }
  const end = enc.flush();
  if (end.length) parts.push(Buffer.from(end.buffer, end.byteOffset, end.length));
  return Buffer.concat(parts);
}

// ---------- Main ----------

function readPost(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const front = fm ? fm[1] : '';
  const body = fm ? raw.slice(fm[0].length) : raw;
  const field = (name) => front.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '');
  return { title: field('title') || '', draft: field('draft') === 'true', body };
}

let ttsPromise = null;
async function getTTS() {
  if (!ttsPromise && process.env.TTS_MOCK) {
    // Test switch: a tone padded with silence, roughly 60 ms per character.
    ttsPromise = Promise.resolve({
      generate: async (text) => {
        const rate = 24000, n = Math.round(rate * (0.4 + text.length * 0.06)), a = new Float32Array(n);
        for (let i = rate * 0.2; i < n - rate * 0.2; i++) a[i] = 0.2 * Math.sin(i / 6);
        return { audio: a, sampling_rate: rate };
      },
    });
  }
  if (!ttsPromise) {
    const { KokoroTTS } = await import('kokoro-js');
    console.log(`Loading Kokoro (${DTYPE})…`);
    ttsPromise = KokoroTTS.from_pretrained(MODEL_ID, { dtype: DTYPE, device: 'cpu' });
  }
  return ttsPromise;
}

async function narrate(blocks) {
  const tts = await getTTS();
  const out = [];
  let rate = 24000;
  let length = 0;
  const starts = [];
  for (let b = 0; b < blocks.length; b++) {
    if (b > 0) {
      const gap = new Float32Array(Math.round(rate * GAP_PARAGRAPH));
      out.push(gap);
      length += gap.length;
    }
    starts.push(length);
    const pieces = splitText(blocks[b].text);
    for (let p = 0; p < pieces.length; p++) {
      if (p > 0) {
        const gap = new Float32Array(Math.round(rate * GAP_SENTENCE));
        out.push(gap);
        length += gap.length;
      }
      const audio = await tts.generate(pieces[p], { voice: VOICE, speed: 1 });
      rate = audio.sampling_rate;
      const samples = trimSilence(audio.audio, rate);
      out.push(samples);
      length += samples.length;
    }
  }
  const all = new Float32Array(length);
  let o = 0;
  for (const part of out) all.set(part, o), (o += part.length);
  return { samples: all, rate, starts: starts.map((s) => +(s / rate).toFixed(2)) };
}

async function main() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  const old = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const manifest = {};
  // Saved after every post, so a run that is stopped part-way keeps its progress.
  const save = (entries) => fs.writeFileSync(MANIFEST, JSON.stringify(entries, null, 2) + '\n');

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md')).sort();
  for (const name of files) {
    const slug = name.replace(/\.md$/, '');
    const post = readPost(path.join(POSTS_DIR, name));
    if (post.draft) continue;

    const blocks = [{ text: post.title.replace(/[.!?]?$/, '.'), key: '' }, ...extractBlocks(post.body)];
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ VERSION, VOICE, MODEL_ID, DTYPE, KBPS, GAP_SENTENCE, GAP_PARAGRAPH, blocks: blocks.map((b) => b.text) }))
      .digest('hex')
      .slice(0, 16);
    const mp3 = path.join(AUDIO_DIR, `${slug}.mp3`);

    if (old[slug]?.hash === hash && fs.existsSync(mp3)) {
      manifest[slug] = old[slug];
      console.log(`✓ ${slug} (unchanged)`);
      continue;
    }

    const t0 = Date.now();
    const words = blocks.reduce((n, b) => n + b.text.split(' ').length, 0);
    console.log(`… ${slug}: ${blocks.length} blocks, ${words} words`);
    const { samples, rate, starts } = await narrate(blocks);
    fs.writeFileSync(mp3, encodeMp3(samples, rate));
    const duration = +(samples.length / rate).toFixed(2);
    manifest[slug] = {
      src: `/audio/${slug}.mp3?v=${hash}`,
      hash,
      voice: VOICE,
      duration,
      blocks: blocks.map((b, i) => ({ t: starts[i], k: b.key })).filter((b) => b.k),
    };
    save({ ...old, ...manifest });
    const secs = (Date.now() - t0) / 1000;
    console.log(`✓ ${slug}: ${(duration / 60).toFixed(1)} min of audio in ${secs.toFixed(0)} s`);
  }

  // Remove MP3s of posts that were deleted or renamed.
  for (const f of fs.readdirSync(AUDIO_DIR)) {
    if (f.endsWith('.mp3') && !manifest[f.replace(/\.mp3$/, '')]) fs.rmSync(path.join(AUDIO_DIR, f));
  }

  save(manifest);
  console.log(`Done: ${Object.keys(manifest).length} posts with audio.`);
}

// Allow importing helpers in tests without running the generator.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { extractBlocks, encodeMp3, splitText };
