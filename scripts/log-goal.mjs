#!/usr/bin/env node
// Attaches a photos/rating/writeup log entry to one goal from a month's
// goals file: creates src/content/goal-logs/YYYY-MM-DD-slug.md and links it
// back via that goal's `logSlug`.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';
import { slugify, todayISODate, currentMonthKey } from './lib/slugify.mjs';
import { readFrontmatter, writeFrontmatter } from './lib/frontmatter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOALS_DIR = join(__dirname, '..', 'src', 'content', 'goals');
const GOAL_LOGS_DIR = join(__dirname, '..', 'src', 'content', 'goal-logs');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--month') args.month = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const month = args.month || currentMonthKey();
  const goalsPath = join(GOALS_DIR, `${month}.md`);

  if (!existsSync(goalsPath)) {
    console.error(`\nNo goals file for ${month} yet — run \`npm run new:month\` first.`);
    process.exit(1);
  }

  const { data, body: goalsBody } = readFrontmatter(goalsPath);
  if (!data.goals || data.goals.length === 0) {
    console.error(`\nsrc/content/goals/${month}.md has no goals to log against.`);
    process.exit(1);
  }

  const { goalIndex } = await prompts(
    {
      type: 'select',
      name: 'goalIndex',
      message: `Which goal from ${month}?`,
      choices: data.goals.map((g, i) => ({
        title: `${g.done ? '[done] ' : ''}${g.text}${g.logSlug ? ' (already has a log — will overwrite the link)' : ''}`,
        value: i,
      })),
    },
    { onCancel: () => process.exit(1) }
  );

  const goal = data.goals[goalIndex];

  const answers = await prompts(
    [
      { type: 'text', name: 'title', message: 'Log entry title', initial: goal.text },
      { type: 'number', name: 'rating', message: 'Rating 1-5 (optional, leave blank to skip)', min: 1, max: 5 },
      { type: 'confirm', name: 'markDone', message: 'Mark this goal as done?', initial: true },
    ],
    { onCancel: () => process.exit(1) }
  );

  const date = todayISODate();
  const slug = slugify(answers.title);
  const filename = `${date}-${slug}.md`;
  const filepath = join(GOAL_LOGS_DIR, filename);

  if (existsSync(filepath)) {
    console.error(`\nsrc/content/goal-logs/${filename} already exists — pick a different title.`);
    process.exit(1);
  }

  const logFrontmatter = {
    title: answers.title,
    goalText: goal.text,
    month,
    date,
    ...(answers.rating ? { rating: answers.rating } : {}),
    draft: false,
  };

  const body = [
    'Write about it here.',
    '',
    'To add photos: drop image files next to this one in',
    '`src/content/goal-logs/`, then reference one as the cover by adding',
    '`coverImage: ./your-photo.jpg` to the frontmatter above, list several as',
    '`gallery: [./photo1.jpg, ./photo2.jpg]`, and/or embed any number of them',
    'right in this body with `![](./your-photo.jpg)`.',
    '',
  ].join('\n');

  mkdirSync(GOAL_LOGS_DIR, { recursive: true });
  writeFileSync(filepath, `---\n${Object.entries(logFrontmatter).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')}\n---\n\n${body}`);

  goal.logSlug = filename.replace(/\.md$/, '');
  if (answers.markDone) goal.done = true;
  writeFrontmatter(goalsPath, data, goalsBody);

  console.log(`\nCreated src/content/goal-logs/${filename}`);
  console.log(`Linked from the "${goal.text}" goal in src/content/goals/${month}.md`);
  console.log('\nNext: open the log file, write it up, add photos, then commit + push.');
}

main();
