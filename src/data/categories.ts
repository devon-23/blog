export type RecommendationCategory =
  | 'food'
  | 'music'
  | 'culture'
  | 'wellness'
  | 'travel'
  | 'favorites'
  | 'misc';

export const CATEGORY_META: Record<RecommendationCategory, { label: string; emoji: string }> = {
  food: { label: 'Food & Drink', emoji: '🍴' },
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
  'music',
  'food',
  'culture',
  'wellness',
  'travel',
  'misc',
];
