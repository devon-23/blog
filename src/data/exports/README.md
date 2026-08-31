# Full history exports (optional)

RSS only carries so much: **Letterboxd's diary feed stops at the most recent 50
entries**, and anything older simply isn't reachable that way. Dropping the
official export files in this folder backfills the rest. They're read straight
off disk at build time and merged with the live feeds — the feed wins on
overlap, because it carries poster/cover art the exports don't.

Nothing here is required. With no files present the site just runs on RSS.

## Letterboxd

Settings → **Import & Export** → *Export your data* → unzip, and copy these in:

- `diary.csv` — every watch, with dates and ratings
- `reviews.csv` — your review text
- `ratings.csv`, `watched.csv` — thinner fallbacks for films missing above
- `lists/<slug>.csv` — a ranked list (e.g. `lists/2026-ranked.csv` for the
  "2026 Ranked" desktop app). Letterboxd's export zips one CSV per list into a
  `lists/` folder already, named after the list — copy the whole folder in.
  Row order in the file is the list's own order; only films that already have
  a diary watch (and so already appear on the site) show up in the app, since
  the CSV itself carries no poster art. List and watchlist RSS are blocked by
  a Cloudflare challenge, so this export is the only way to get list data in.

## Goodreads

My Books → **Import and export** → *Export Library* → wait for the file, then
copy it in as:

- `goodreads_library_export.csv`

## Notes

- Exports are a **snapshot**. Re-export and re-commit when you want the back
  catalogue to catch up; recent stuff keeps flowing in through RSS regardless.
- Films/books that exist only in an export have **no cover art** — the exports
  don't include images. They show a text placeholder until they reappear in the
  RSS window.
- These are plain CSVs of your own public data, so they're fine to commit.
