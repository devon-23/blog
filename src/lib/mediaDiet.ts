import { getMediaLibrary } from './media';
import { formatDate } from './format';

// A narrow view of the media library for the Currently window and page: the
// few most recent things, flattened to exactly the fields those panels render.
//
// Kept separate from DesktopMediaItem (which the Movies/Books/Albums lists use)
// because Currently *does* show review text, while the list views don't — and
// this is only ever a handful of rows, so carrying the reviews is cheap here.

export interface DietItem {
  title: string;
  /** Year for a film, author for a book. */
  subtitle?: string;
  coverUrl?: string;
  rating?: number;
  review?: string;
  dateLabel?: string;
  meta?: string;
  /** Internal page, when the item has one. */
  href?: string;
  externalUrl: string;
}

export interface MediaDiet {
  films: DietItem[];
  finishedBooks: DietItem[];
  readingNow: DietItem[];
}

export async function getMediaDiet(): Promise<MediaDiet> {
  const { movies, books } = await getMediaLibrary();

  const toDiet = (item: (typeof movies)[number]): DietItem => ({
    title: item.title,
    subtitle: item.subtitle,
    coverUrl: item.coverUrl,
    rating: item.rating,
    review: item.review,
    dateLabel: item.date ? formatDate(item.date) : undefined,
    meta: item.meta,
    href: item.hasPage ? item.href : undefined,
    externalUrl: item.externalUrl,
  });

  return {
    films: movies.slice(0, 8).map(toDiet),
    finishedBooks: books.filter((b) => b.shelf === 'read').slice(0, 8).map(toDiet),
    readingNow: books.filter((b) => b.shelf === 'currently-reading').slice(0, 3).map(toDiet),
  };
}
