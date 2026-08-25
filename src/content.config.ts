import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
    category: z.enum(['food', 'music', 'culture', 'wellness', 'travel', 'favorites', 'misc']),
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
      })
    ),
    generatedAt: z.coerce.date().optional(),
    notes: z.string().optional(),
  }),
});

export const collections = { posts, recommendations, goals };
