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

## Monthly recap & history

Nothing to do here — `/recap/YYYY-MM/` pages and the History app are
generated automatically from whatever posts, recommendations, and goals are
dated into that month. A month simply appears once something exists for it.

## Marking something as a draft

Add `draft: true` to a post's or recommendation's frontmatter to keep it out
of all lists/pages/recaps until you're ready. Remove it (or set to `false`)
to publish.
