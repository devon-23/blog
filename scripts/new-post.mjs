#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';
import { slugify, todayISODate } from './lib/slugify.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, '..', 'src', 'content', 'posts');

async function main() {
  const answers = await prompts(
    [
      {
        type: 'select',
        name: 'type',
        message: 'What kind of post is this?',
        choices: [
          { title: 'Article', value: 'article' },
          { title: 'Think Piece', value: 'thinkpiece' },
          { title: 'Update (life update / currently into / trip)', value: 'update' },
        ],
      },
      { type: 'text', name: 'title', message: 'Title', validate: (v) => (v.trim() ? true : 'Title is required') },
      { type: 'text', name: 'summary', message: 'One-line summary (shown on cards)' },
      { type: 'text', name: 'tags', message: 'Tags (comma-separated, optional)' },
    ],
    { onCancel: () => process.exit(1) }
  );

  const date = todayISODate();
  const slug = slugify(answers.title);
  const filename = `${date}-${slug}.md`;
  const filepath = join(POSTS_DIR, filename);

  if (existsSync(filepath)) {
    console.error(`\nA post already exists at src/content/posts/${filename} — nothing was overwritten.`);
    console.error('Pick a different title, or edit that file directly.');
    process.exit(1);
  }

  const tags = answers.tags
    ? answers.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(answers.title)}`,
    `type: ${answers.type}`,
    `date: ${date}`,
    `summary: ${JSON.stringify(answers.summary || '')}`,
    `tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]`,
    'draft: false',
    '---',
    '',
    'Write the piece here.',
    '',
  ].join('\n');

  mkdirSync(POSTS_DIR, { recursive: true });
  writeFileSync(filepath, frontmatter);

  console.log(`\nCreated src/content/posts/${filename}`);
  console.log('Next: open it, write the body under the frontmatter, then commit + push.');
  console.log('(Nothing here ever gets deleted — this only adds a new file.)');
}

main();
