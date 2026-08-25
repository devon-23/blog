#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';
import { slugify, todayISODate } from './lib/slugify.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RECS_DIR = join(__dirname, '..', 'src', 'content', 'recommendations');

const CATEGORIES = ['food', 'music', 'culture', 'wellness', 'travel', 'favorites', 'misc'];

async function main() {
  const answers = await prompts(
    [
      { type: 'text', name: 'title', message: 'Title', validate: (v) => (v.trim() ? true : 'Title is required') },
      {
        type: 'select',
        name: 'category',
        message: 'Category',
        choices: CATEGORIES.map((c) => ({ title: c, value: c })),
      },
      { type: 'text', name: 'summary', message: 'One-line summary (optional)' },
      { type: 'text', name: 'link', message: 'Link (optional, URL)' },
      {
        type: 'number',
        name: 'rating',
        message: 'Rating 1-5 (optional, leave blank to skip)',
        min: 1,
        max: 5,
      },
    ],
    { onCancel: () => process.exit(1) }
  );

  const date = todayISODate();
  const slug = slugify(answers.title);
  const filename = `${date}-${slug}.md`;
  const filepath = join(RECS_DIR, filename);

  if (existsSync(filepath)) {
    console.error(`\nA recommendation already exists at src/content/recommendations/${filename} — nothing was overwritten.`);
    process.exit(1);
  }

  const lines = [
    '---',
    `title: ${JSON.stringify(answers.title)}`,
    `category: ${answers.category}`,
    `date: ${date}`,
  ];
  if (answers.summary) lines.push(`summary: ${JSON.stringify(answers.summary)}`);
  if (answers.link) lines.push(`link: ${JSON.stringify(answers.link)}`);
  if (answers.rating) lines.push(`rating: ${answers.rating}`);
  lines.push('draft: false', '---', '', 'Write why it matters here.', '');

  mkdirSync(RECS_DIR, { recursive: true });
  writeFileSync(filepath, lines.join('\n'));

  console.log(`\nCreated src/content/recommendations/${filename}`);
  console.log('Next: open it, write the "why it matters" body, then commit + push.');
}

main();
