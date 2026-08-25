#!/usr/bin/env node
// Draws a random set of goals for a month from src/data/goalPool.ts and
// writes src/content/goals/YYYY-MM.md. Never overwrites an existing month.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { currentMonthKey } from './lib/slugify.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOALS_DIR = join(__dirname, '..', 'src', 'content', 'goals');
const GOAL_POOL_PATH = join(__dirname, '..', 'src', 'data', 'goalPool.ts');

function parseArgs(argv) {
  const args = { count: 4 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--month') args.month = argv[++i];
    if (argv[i] === '--count') args.count = Number(argv[++i]);
  }
  return args;
}

function pickRandom(pool, count, avoid) {
  const candidates = pool.filter((g) => !avoid.has(g));
  const source = candidates.length >= count ? candidates : pool;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const month = args.month || currentMonthKey();
  const filepath = join(GOALS_DIR, `${month}.md`);

  if (existsSync(filepath)) {
    console.error(`\nsrc/content/goals/${month}.md already exists — not overwriting.`);
    console.error('Edit that file directly to change goals or mark them done.');
    process.exit(1);
  }

  const { GOAL_POOL } = await import(GOAL_POOL_PATH);

  // Avoid repeating whatever the previous month drew, if it exists.
  const [year, monthNum] = month.split('-').map(Number);
  const prevDate = new Date(Date.UTC(year, monthNum - 2, 1));
  const prevKey = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`;
  const prevPath = join(GOALS_DIR, `${prevKey}.md`);
  const avoid = new Set();
  if (existsSync(prevPath)) {
    const prevContent = readFileSync(prevPath, 'utf-8');
    const matches = [...prevContent.matchAll(/text:\s*(.+)/g)];
    matches.forEach((m) => avoid.add(m[1].trim().replace(/^['"]|['"]$/g, '')));
  }

  const drawn = pickRandom(GOAL_POOL, args.count, avoid);

  const lines = [
    '---',
    `month: '${month}'`,
    `generatedAt: ${new Date().toISOString().slice(0, 10)}`,
    'goals:',
    ...drawn.map((g) => `  - text: ${JSON.stringify(g)}\n    done: false`),
    '---',
    '',
  ];

  mkdirSync(GOALS_DIR, { recursive: true });
  writeFileSync(filepath, lines.join('\n'));

  console.log(`\nCreated src/content/goals/${month}.md with ${drawn.length} goals:`);
  drawn.forEach((g) => console.log(`  - ${g}`));
  console.log('\nEdit the file any time to swap a goal or mark one done: true.');
}

main();
