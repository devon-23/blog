export type RecommendationCategory =
  | 'food'
  | 'movies'
  | 'tv shows'
  | 'music'
  | 'culture'
  | 'wellness'
  | 'travel'
  | 'favorites'
  | 'misc';

export const CATEGORY_META: Record<RecommendationCategory, { label: string; emoji: string }> = {
  food: { label: 'Food & Drink', emoji: '🍴' },
  movies: { label: 'Movies', emoji: '🎬' },
  'tv shows': { label: 'TV Shows', emoji: '📺' },
  music: { label: 'Music', emoji: '🎻' },
  culture: { label: 'Culture', emoji: '🗡️' },
  wellness: { label: 'Wellness', emoji: '💤' },
  travel: { label: 'Travel', emoji: '✈️' },
  favorites: { label: 'Favorites', emoji: '♥️' },
  misc: { label: 'Misc', emoji: '📌' },
};

// Order categories should be displayed in on the Recommendations app/page.
export const CATEGORY_ORDER: RecommendationCategory[] = [
  'favorites',
  'movies',
  'tv shows',
  'music',
  'food',
  'culture',
  'wellness',
  'travel',
  'misc',
];

// The full list of valid category ids, derived from CATEGORY_META so it can
// never drift out of sync. src/content.config.ts imports this to build the
// recommendations schema's category enum — so adding a category here is the
// only place you need to touch (this file) to make a new category valid.
export const CATEGORY_IDS = Object.keys(CATEGORY_META) as [RecommendationCategory, ...RecommendationCategory[]];
