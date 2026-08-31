// `import type` is fully erased at build time, so pulling this in from the
// build-only media module never drags its node:fs imports into the client
// bundle — it just keeps one definition instead of two.
import type { DietItem } from '../../lib/mediaDiet';

export interface DesktopPost {
  slug: string;
  title: string;
  summary: string;
  type: 'article' | 'thinkpiece' | 'update';
  dateLabel: string;
  href: string;
  coverImageSrc?: string;
  /** Posted recently enough to earn the blinking NEW! tag. */
  isNew: boolean;
}

export interface DesktopRecommendation {
  slug: string;
  title: string;
  summary?: string;
  category: string;
  categoryLabel: string;
  categoryEmoji: string;
  dateLabel: string;
  rating?: number;
  href: string;
  coverImageSrc?: string;
  isNew: boolean;
}

export interface DesktopGoal {
  text: string;
  done: boolean;
  logHref?: string;
}

export interface DesktopMonth {
  key: string;
  label: string;
  href: string;
  goals: DesktopGoal[] | null;
}

export interface DesktopGalleryImage {
  src: string;
  width: number;
  height: number;
  sourceTitle: string;
  sourceHref: string;
  sourceKind: string;
  dateLabel: string;
}

/** Everything the Currently window shows, fetched at build time. */
export interface DesktopMediaDiet {
  films: DietItem[];
  finishedBooks: DietItem[];
  readingNow: DietItem[];
}

/**
 * A film/book/album row in the Movies, Books and Albums windows. Deliberately
 * slimmer than lib/media.ts's MediaItem: this whole array is serialized into
 * the page HTML as island props, and 190 books' worth of review text and
 * publisher blurbs would bloat every page load for data the list never shows.
 */
export interface DesktopMediaItem {
  slug: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  rating?: number;
  /** Sort key — epoch ms, 0 when the source has no date. */
  sortDate: number;
  dateLabel?: string;
  meta?: string;
  playcount?: number;
  /** Position in a curated list (the "2026 Ranked" app), 1-based. */
  rank?: number;
  externalUrl: string;
  /** Internal page href, or undefined when this item has no page of its own. */
  href?: string;
  /** True when there's a written note attached, so the list can flag it. */
  hasNote: boolean;
}

export interface DesktopData {
  posts: DesktopPost[];
  recommendations: DesktopRecommendation[];
  months: DesktopMonth[];
  galleryImages: DesktopGalleryImage[];
  mediaDiet: DesktopMediaDiet;
  movies: DesktopMediaItem[];
  books: DesktopMediaItem[];
  albums: DesktopMediaItem[];
  /** The "2026 Ranked" list, in rank order. Empty until the export CSV exists. */
  rankedMovies: DesktopMediaItem[];
}
