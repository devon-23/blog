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
| `npm run log:goal`            | Attach a photos/rating/writeup log to a goal      |
| `npm run new:movie`           | Write a note on a film (looks up the slug for you) |
| `npm run new:book`            | Write a note on a book                            |
| `npm run new:album`           | Write a note on an album                          |

## Connected accounts

Three feeds describe what I'm actually into, so none of it is hand-maintained.
All handles live in one file: **`src/data/profiles.ts`**.

| Source | What it feeds | When it refreshes |
| :--- | :--- | :--- |
| **Last.fm** | Music window, Now Playing gadget, the marquee | Live — polled in the browser every 10s |
| **Letterboxd** | "Last watched" + the poster strip | At build time, from public RSS |
| **Goodreads** | "Reading now" / "Last read" + cover strip | At build time, from public RSS |

Letterboxd and Goodreads both expose **keyless** public RSS, so there's no token
to keep secret — but it does mean those panels only change when the site
rebuilds. `src/lib/feeds.ts` does the fetching, caches to `.cache/feeds/` for 6h
so local builds don't hammer them, and degrades to an empty panel rather than
failing the build if a feed is down.

Only one Last.fm poller runs no matter how many components ask for it — see the
singleton note at the top of `src/components/music/useNowPlaying.ts`.

## The media library

Every film, book and album becomes a page on the site: `/movies/`, `/books/`,
`/albums/`, each sortable by newest, highest rated, A–Z (or most played), with
search and a "rated only" filter. The index pages render fully server-side and
sort via progressive enhancement, so they work with JavaScript off.

**Feed data is the source of truth for facts; your writing lives beside it.**
Drop a Markdown file at `src/content/movies/<slug>.md` (or `books/`, `albums/`)
and its body appears on that item's page under "More thoughts". The rating,
review and dates keep coming from the feed and refresh on every build — the
overlay is never overwritten, because the fetch never touches it.

```
npm run new:movie     # searches your Letterboxd diary, writes the file for you
npm run new:book
npm run new:album
```

Use those rather than creating the file by hand: **the filename is the join
key**, and a note whose slug doesn't match its item silently never appears. The
script looks the slug up from the live feed so it can't drift.

### Which items get their own page

| Kind | Gets a page when |
| :--- | :--- |
| Film | always |
| Book | you rated it, reviewed it, or wrote a note (190 read books would otherwise be 190 near-empty pages) |
| Album | you wrote a note — Last.fm has no rating or review to show |

Everything else still appears in the index, linking out to the source instead.

### Cross-links

A recommendation whose `link` points at a Letterboxd film or Goodreads book is
matched to that item **automatically, in both directions** — no extra
frontmatter. The recommendation gets a "my full watch log" card, and the film
page lists the recommendation under Related. Add arbitrary extra links via
`links:` in an overlay note's frontmatter.

### Full history

RSS is truncated — Letterboxd's diary feed stops at the **most recent 50
entries**. To backfill everything older, drop the official Letterboxd and
Goodreads export files into `src/data/exports/`; they're merged with the live
feeds at build time. See [`src/data/exports/README.md`](./src/data/exports/README.md).

## A few early-2000s flourishes

- **My Profile** — a MySpace profile: contact table, mood, interests, and a Top 8. All editable text in `PROFILE` in `src/data/profiles.ts`.
- **Currently** (window, and `/currently/` as a real page) — last film, current book, current song, side by side. The page version is static HTML so it's crawlable and works without JavaScript.
- **Now Playing gadget** — the floating desktop player, a port of [nowPlaying](https://github.com/devon-23/nowPlaying). Spins and lights up only while something is actually playing. Toggle it from the ♪ tray button or by right-clicking the desktop.
- **Marquee ticker** — the scrolling banner across the top, assembled from live site state (newest post, last film, current book, current track). CSS animation, not `<marquee>`; pauses under `prefers-reduced-motion`.
- **Guestbook** — signs into the visitor's own `localStorage`. The site is static, so there's no server to post to and nobody else sees your entry; the UI says so plainly. Making it real needs a backend (a form service or a tiny serverless endpoint).
- **Hit counter** — in the taskbar tray. Counts *your* visits on top of a fixed baseline, since again: no server.
- **Search** (Search icon / `/pagefind/`) — static full-text search over every page, via [Pagefind](https://pagefind.app). Only works after a real build (`npm run build`, which indexes `dist/` in a `postbuild` step) — it won't find anything under plain `npm run dev`.
- **Links page** (`/links/`) — a classic blogroll with 88x31 pixel web badges (`public/badges/`, listed in `src/data/badges.ts`) and an empty webring slot.
- **Display Properties** — right-click the desktop background → Properties to switch wallpaper (Teal / Clouds / Maze / Starfield / Glitter / Checkers / Y2K / Matrix); the choice is remembered per-visitor via `localStorage`.
- **Gallery** (`/gallery/`) — every cover photo and gallery image across the whole site, pulled together automatically. See "Adding photos" in [AUTHORING.md](./AUTHORING.md).
- **Rich links** — a recommendation's `link` embeds a YouTube/Spotify player automatically, or shows a fetched Open Graph preview card (poster, title, description) for anything else — a Letterboxd film link, IMDb, Goodreads, whatever. See "Rich links" in [AUTHORING.md](./AUTHORING.md).
- **Everything opens in a window.** Clicking a film, book, article or recommendation in a list opens it as a draggable Win98 window instead of navigating away — including links *inside* an open window, so following "Related → the recommendation" keeps you on the desktop. Those are still real `<a href>`s: cmd/ctrl/middle-click opens a normal tab, URLs stay shareable, and with JS off the site navigates exactly as before. Windows fetch the page's own `.doc-body` rather than duplicating its markup into the bundle (`DocumentWindowApp.tsx`), so page and window can't drift apart.
- **NEW!** tags blink next to anything posted in the last 14 days (`NEW_WINDOW_MS` in `src/pages/index.astro`).

## Project structure

- `src/content/posts/` — articles, think pieces, and updates (Markdown + frontmatter)
- `src/content/recommendations/` — short recommendation cards, grouped by category
- `src/content/goals/` — one file per month of drawn goals
- `src/data/goalPool.ts` — the pool `new:month` draws from; edit freely
- `src/data/profiles.ts` — external account handles + the MySpace profile text
- `src/lib/feeds.ts` — build-time Letterboxd / Goodreads / Last.fm fetching
- `src/lib/media.ts` — joins feed data + your notes + recommendation cross-links
- `src/content/{movies,books,albums}/` — your notes, keyed by the item's slug
- `src/data/exports/` — optional Letterboxd/Goodreads CSV exports for full history
- `src/components/desktop/` — the Win98 window manager, taskbar, start menu
- `src/components/music/` — the Last.fm-powered Music app (ported from [Spinning](https://github.com/devon-23/Spinning))
- `src/pages/recap/[month].astro` — auto-generated monthly recap pages
- `.github/workflows/deploy.yml` — build + deploy to GitHub Pages

## Deployment

Pushing to `main` builds and deploys automatically via GitHub Actions. The
repo's **Settings → Pages → Source** must be set to "GitHub Actions" once
(this can't be done from code).
