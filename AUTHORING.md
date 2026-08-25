# Adding content

Nothing on this site is ever deleted, only added to. Every workflow below
just creates a new file — old files are never touched.

## New article, think piece, or update

```sh
npm run new:post
```

Answer the prompts (type, title, summary, tags). This creates
`src/content/posts/YYYY-MM-DD-your-title.md` with the frontmatter filled in.
Open that file, write the body underneath the frontmatter (plain Markdown),
then:

```sh
git add src/content/posts/YYYY-MM-DD-your-title.md
git commit -m "Add: your title"
git push
```

Pushing to `main` rebuilds and redeploys the site automatically.

"Update" is for life-update posts — what you're currently into, upcoming
trips, that kind of thing. Articles and think pieces are for longer writing.

## New recommendation

```sh
npm run new:recommendation
```

Answer the prompts (title, category, optional link/rating/summary). This
creates `src/content/recommendations/YYYY-MM-DD-your-title.md`. Open it and
write a short "why it matters" body, then commit + push as above.
Recommendations show up grouped by category on the Recommendations app/page.

### Adding a new category

`src/data/categories.ts` is the single source of truth for valid categories
(id, label, emoji, and display order). To add one — say, `games` — add it in
three places in that one file: the `RecommendationCategory` type, the
`CATEGORY_META` map, and `CATEGORY_ORDER`. That's it: both the content
schema (`content.config.ts`) and the `new:recommendation` prompt read from
this file automatically, so nothing else needs to change. (Previously the
valid list was duplicated in `content.config.ts` too, which is what caused
existing recommendations to fail validation after adding a category only
here — that's fixed now, this file is the only place to touch.)

## New month's goals

```sh
npm run new:month
```

Draws 4 random goals from `src/data/goalPool.ts` for the current month and
writes `src/content/goals/YYYY-MM.md`. Won't overwrite a month that already
has a file. Options:

```sh
npm run new:month -- --month 2026-09   # generate for a specific month
npm run new:month -- --count 6         # draw a different number of goals
```

To mark a goal done, open that month's file and flip `done: false` to
`done: true` for that goal, then commit + push. You can also hand-edit the
list of goals directly — swap one out, add a one-off, whatever.

`src/data/goalPool.ts` is the pool `new:month` draws from — it's just a plain
array of strings. Add your own real goal ideas to it any time; removing an
entry only stops it from being drawn again, it doesn't affect any month that
already drew it.

## Logging a goal (photos, rating, notes)

```sh
npm run log:goal
```

Pick which goal (from the current month, or `-- --month 2026-09` for another
one), give the log entry a title, an optional 1-5 rating, and say whether to
mark the goal done. This creates
`src/content/goal-logs/YYYY-MM-DD-your-title.md` and links it from that goal
— it'll show up as a "photos & notes →" link next to the goal in both the
Goals app and that month's recap page.

Open the new file and write it up. To add photos, drop image files next to
it in `src/content/goal-logs/`, then either set `coverImage: ./photo.jpg` in
its frontmatter or embed any number of them in the body with
`![](./photo.jpg)`. Commit + push as usual.

## Adding photos

Articles, think pieces, updates, recommendations, and goal logs can all
carry photos — a single cover image and/or a whole gallery. There's no
upload button (this is a static site); adding a photo means committing an
image file, same as adding any other content:

1. Drop the image file(s) next to the Markdown file they belong to — e.g. a
   photo for `src/content/recommendations/2026-08-24-some-place.md` goes in
   `src/content/recommendations/` too (a subfolder like
   `src/content/recommendations/images/` works fine as well, since the path
   is just relative to the Markdown file).
2. Reference it in that file's frontmatter:
   ```yaml
   coverImage: ./your-photo.jpg
   gallery: [./photo1.jpg, ./photo2.jpg, ./photo3.jpg]
   ```
   Both are optional, and you can use either or both. `coverImage` shows up
   at the top of the piece (and as a thumbnail on its list/card everywhere
   else on the site); `gallery` renders as a grid at the bottom of the page.
3. You can also embed images inline, anywhere in the body text, with normal
   Markdown: `![a caption](./your-photo.jpg)`.
4. Commit the image file(s) along with the `.md` file and push, same as
   always.

Every `npm run new:post` / `new:recommendation` / `log:goal` scaffold
includes commented-out `coverImage`/`gallery` lines as a reminder — just
uncomment and fill in the path once you've picked a photo.

### The Gallery

Every `coverImage` and every `gallery` photo across the whole site — posts,
recommendations, goal logs, all of it — automatically shows up in one place:
the Gallery app (and `/gallery/` page), newest first. Nothing to maintain
here either; it's pulled together automatically from whatever images exist.

## Rich links on recommendations

A recommendation's `link` field isn't just a plain "visit link" anymore —
what shows up depends on what kind of link it is:

- **YouTube** (`youtube.com/watch...` or `youtu.be/...`) — embeds the actual
  video player.
- **Spotify** (`open.spotify.com/...` — a track, album, playlist, etc.) —
  embeds the Spotify player.
- **Anything else** (Letterboxd, IMDb, Goodreads, a restaurant's website,
  whatever) — at build time, the site fetches that page's Open Graph
  metadata and shows a preview card: poster/image, title, and description,
  linking out to the original. This is what makes a Letterboxd film link
  show its poster and title automatically, for example — no extra fields to
  fill in, just paste the link.
- If a link can't be reached or has no preview metadata, it just falls back
  to a plain "Visit link →", same as before — nothing breaks.

This all happens automatically from the `link` field you already fill in
when running `npm run new:recommendation`; there's nothing extra to do.
(Fetched previews are cached in `.cache/link-previews/` — not committed —
so repeated local builds don't keep re-fetching the same links.)

## Monthly recap & history

Nothing to do here — `/recap/YYYY-MM/` pages and the History app are
generated automatically from whatever posts, recommendations, and goals are
dated into that month. A month simply appears once something exists for it.

## Marking something as a draft

Add `draft: true` to a post's or recommendation's frontmatter to keep it out
of all lists/pages/recaps until you're ready. Remove it (or set to `false`)
to publish.
