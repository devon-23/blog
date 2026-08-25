import { getCollection, type CollectionEntry } from 'astro:content';
import { formatMonthLabel, toMonthKey } from './format';

export type PostEntry = CollectionEntry<'posts'>;
export type RecommendationEntry = CollectionEntry<'recommendations'>;
export type GoalEntry = CollectionEntry<'goals'>;

async function publishedPosts(): Promise<PostEntry[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

async function publishedRecommendations(): Promise<RecommendationEntry[]> {
  const recs = await getCollection('recommendations', ({ data }) => !data.draft);
  return recs.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getPostsByType(type: 'article' | 'thinkpiece' | 'update'): Promise<PostEntry[]> {
  const posts = await publishedPosts();
  return posts.filter((post) => post.data.type === type);
}

export async function getAllPublishedPosts(): Promise<PostEntry[]> {
  return publishedPosts();
}

export async function getAllPublishedRecommendations(): Promise<RecommendationEntry[]> {
  return publishedRecommendations();
}

/** Every distinct YYYY-MM key that has a post, recommendation, or goals file, newest first. */
export async function getAllMonthKeys(): Promise<string[]> {
  const [posts, recs, goals] = await Promise.all([
    publishedPosts(),
    publishedRecommendations(),
    getCollection('goals'),
  ]);

  const keys = new Set<string>();
  for (const post of posts) keys.add(toMonthKey(post.data.date));
  for (const rec of recs) keys.add(toMonthKey(rec.data.date));
  for (const goal of goals) keys.add(goal.data.month);

  return Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
}

export interface MonthRecap {
  monthKey: string;
  label: string;
  posts: PostEntry[];
  recommendations: RecommendationEntry[];
  goals: GoalEntry | null;
}

export async function getMonthRecap(monthKey: string): Promise<MonthRecap> {
  const [posts, recs, goalEntries] = await Promise.all([
    publishedPosts(),
    publishedRecommendations(),
    getCollection('goals'),
  ]);

  return {
    monthKey,
    label: formatMonthLabel(monthKey),
    posts: posts.filter((post) => toMonthKey(post.data.date) === monthKey),
    recommendations: recs.filter((rec) => toMonthKey(rec.data.date) === monthKey),
    goals: goalEntries.find((goal) => goal.data.month === monthKey) ?? null,
  };
}
