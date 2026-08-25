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
      draft: z.boolean().default(false),
    }),
});

const recommendations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recommendations' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(CATEGORY_IDS),
    date: z.coerce.date(),
    summary: z.string().optional(),
    link: z.string().url().optional(),
    rating: z.number().min(1).max(5).optional(),
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
      draft: z.boolean().default(false),
    }),
});

export const collections = { posts, recommendations, goals, goalLogs };
