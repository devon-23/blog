# devon's desktop

A personal site styled as a Windows 98 desktop — articles, think pieces, and
recommendations live in draggable windows, the Music window pulls live stats
from Last.fm, and every month gets an automatic recap plus a running history.

Built with [Astro](https://astro.build) (content-as-Markdown, static output)
and a React island for the desktop shell. Deploys to GitHub Pages at
`https://devon-23.github.io/blog/`.

## Adding content

See [AUTHORING.md](./AUTHORING.md) — short version: `npm run new:post`,
`npm run new:recommendation`, or `npm run new:month`, then write the body and
commit. Nothing on this site is ever deleted, only added to.

## Commands

| Command                     | Action                                          |
| :--------------------------- | :----------------------------------------------- |
| `npm install`                | Install dependencies                             |
| `npm run dev`                 | Start the local dev server at `localhost:4321/blog/` |
| `npm run build`               | Build the production site to `./dist/`           |
| `npm run preview`              | Preview the production build locally             |
| `npm run new:post`            | Scaffold a new article / think piece / update    |
| `npm run new:recommendation`  | Scaffold a new recommendation                    |
| `npm run new:month`           | Draw this month's random goals                   |

## Project structure

- `src/content/posts/` — articles, think pieces, and updates (Markdown + frontmatter)
- `src/content/recommendations/` — short recommendation cards, grouped by category
- `src/content/goals/` — one file per month of drawn goals
- `src/data/goalPool.ts` — the pool `new:month` draws from; edit freely
- `src/components/desktop/` — the Win98 window manager, taskbar, start menu
- `src/components/music/` — the Last.fm-powered Music app (ported from [Spinning](https://github.com/devon-23/Spinning))
- `src/pages/recap/[month].astro` — auto-generated monthly recap pages
- `.github/workflows/deploy.yml` — build + deploy to GitHub Pages

## Deployment

Pushing to `main` builds and deploys automatically via GitHub Actions. The
repo's **Settings → Pages → Source** must be set to "GitHub Actions" once
(this can't be done from code).
