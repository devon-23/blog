#!/usr/bin/env node
// Scaffolds an overlay note for a film / book / album:
//   npm run new:movie   npm run new:book   npm run new:album
//
// The whole point is that you never have to guess the slug. This searches the
// live feed by title, shows what it found, and writes the file under the exact
// slug the site derives — because if the filename doesn't match, the note just
// silently never appears.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import prompts from 'prompts';

const KINDS = {
  movie: { dir: 'movies', label: 'film', source: 'Letterboxd' },
  book: { dir: 'books', label: 'book', source: 'Goodreads' },
  album: { dir: 'albums', label: 'album', source: 'Last.fm' },
};

const kind = process.argv[2];
if (!KINDS[kind]) {
  console.error(`Usage: node scripts/new-media-note.mjs <${Object.keys(KINDS).join('|')}>`);
  process.exit(1);
}
const { dir, label, source } = KINDS[kind];

// The feed layer is TypeScript; Node strips the types natively (>=22.12, which
// package.json already requires).
const feeds = await import('../src/lib/feeds.ts');

const items =
  kind === 'movie'
    ? (await feeds.getFilms()).map((f) => ({ slug: f.slug, title: f.title, sub: f.year }))
    : kind === 'book'
      ? (await feeds.getBooks()).map((b) => ({ slug: b.slug, title: b.title, sub: b.author }))
      : (await feeds.getTopAlbums()).map((a) => ({ slug: a.slug, title: a.title, sub: a.artist }));

if (items.length === 0) {
  console.error(`No ${label}s came back from ${source}. Check your connection and try again.`);
  process.exit(1);
}

const { query } = await prompts({
  type: 'text',
  name: 'query',
  message: `Which ${label}? (type part of the title)`,
});
if (!query) process.exit(0);

const needle = query.toLowerCase();
const matches = items.filter(
  (item) => item.title.toLowerCase().includes(needle) || (item.sub ?? '').toLowerCase().includes(needle)
);

if (matches.length === 0) {
  console.error(`\nNothing in your ${source} data matches "${query}".`);
  if (kind === 'movie') {
    console.error('Letterboxd RSS only carries your last 50 diary entries — if this is an older');
    console.error('film, add your export to src/data/exports/ (see the README there).');
  }
  process.exit(1);
}

const { chosen } = await prompts({
  type: 'select',
  name: 'chosen',
  message: `${matches.length} match${matches.length === 1 ? '' : 'es'}:`,
  choices: matches.slice(0, 25).map((item) => ({
    title: `${item.title}${item.sub ? ` — ${item.sub}` : ''}`,
    description: item.slug,
    value: item,
  })),
});
if (!chosen) process.exit(0);

const dirPath = join(process.cwd(), 'src', 'content', dir);
const filePath = join(dirPath, `${chosen.slug}.md`);

if (existsSync(filePath)) {
  console.error(`\nThere's already a note for this one:\n  src/content/${dir}/${chosen.slug}.md`);
  process.exit(1);
}

mkdirSync(dirPath, { recursive: true });
writeFileSync(
  filePath,
  `---
# Optional. Everything here is additive — rating, review and dates still come
# from ${source} and refresh on every build.
# title: "Override the ${source} title"
links: []
---

Write here.
`
);

console.log(`\n✓ src/content/${dir}/${chosen.slug}.md`);
console.log(`  Attaches to: ${chosen.title}${chosen.sub ? ` — ${chosen.sub}` : ''}`);
console.log(`  Shows up at: /${dir}/${chosen.slug}/`);
