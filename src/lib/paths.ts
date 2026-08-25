import { withBase } from './url';
import type { PostEntry, RecommendationEntry } from './recap';

const TYPE_ROUTE: Record<'article' | 'thinkpiece' | 'update', string> = {
  article: 'articles',
  thinkpiece: 'thinkpieces',
  update: 'updates',
};

export function postHref(post: PostEntry): string {
  return withBase(`/${TYPE_ROUTE[post.data.type]}/${post.id}/`);
}

export function recommendationHref(rec: RecommendationEntry): string {
  return withBase(`/recommendations/${rec.id}/`);
}

export function recapHref(monthKey: string): string {
  return withBase(`/recap/${monthKey}/`);
}
