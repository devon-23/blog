import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_IDS } from './data/categories';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      type: z.enum(['article', 'thinkpiece', 'update']),
      date: z.coerce.date(),
      summary: z.string(),
      tags: z.array(z.string()).default([]),
      coverImage: image().optional(),
      gallery: z.array(image()).default([]),
      draft: z.boolean().default(false),
    }),
});

const recommendations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recommendations' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.enum(CATEGORY_IDS),
      date: z.coerce.date(),
      summary: z.string().optional(),
      link: z.string().url().optional(),
      rating: z.number().min(1).max(5).optional(),
      coverImage: image().optional(),
      gallery: z.array(image()).default([]),
      draft: z.boolean().default(false),
    }),
});

const goals = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/goals' }),
  schema: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    goals: z.array(
      z.object({
        text: z.string(),
        done: z.boolean().default(false),
        category: z.string().optional(),
        // Slug of a src/content/goal-logs/*.md entry with photos/rating/notes
        // for this goal, if one has been logged (see `npm run log:goal`).
        logSlug: z.string().optional(),
      })
    ),
    generatedAt: z.coerce.date().optional(),
    notes: z.string().optional(),
  }),
});

// A photos/rating/writeup entry for a single completed (or in-progress) goal,
// linked back to it via goals[].logSlug in the matching month's goals file.
const goalLogs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/goal-logs' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      goalText: z.string(),
      month: z.string().regex(/^\d{4}-\d{2}$/),
      date: z.coerce.date(),
      rating: z.number().min(1).max(5).optional(),
      coverImage: image().optional(),
      gallery: z.array(image()).default([]),
      draft: z.boolean().default(false),
    }),
});

// Overlays on top of Letterboxd / Goodreads / Last.fm data. The FILENAME is
// the join key: `src/content/movies/a-real-pain.md` attaches to the film whose
// Letterboxd slug is `a-real-pain`. Everything here is optional — a film or
// book still gets a page from feed data alone. This is only for what you want
// to add on top, and because it lives in git it survives every refetch.
//
// Scaffold one with `npm run new:movie` / `new:book` / `new:album`, which
// looks the slug up for you rather than making you guess it.
const mediaNoteSchema = ({ image }: { image: () => any }) =>
  z.object({
    // Overrides the feed's title on the page. Rarely needed.
    title: z.string().optional(),
    // Extra "related" links shown alongside the auto-matched recommendations.
    links: z.array(z.object({ label: z.string(), href: z.string().url() })).default([]),
    coverImage: image().optional(),
    gallery: z.array(image()).default([]),
    draft: z.boolean().default(false),
  });

const movies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/movies' }),
  schema: mediaNoteSchema,
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: mediaNoteSchema,
});

const albums = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/albums' }),
  schema: mediaNoteSchema,
});

export const collections = { posts, recommendations, goals, goalLogs, movies, books, albums };
