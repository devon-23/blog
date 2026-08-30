import { getCollection, type CollectionEntry } from 'astro:content';
import { getFilms, getBooks, getTopAlbums, type Film, type Book, type Album } from './feeds';
import { getAllPublishedRecommendations, type RecommendationEntry } from './recap';
import { withBase } from './url';

// The join between three things:
//
//   1. feed data      — Letterboxd / Goodreads / Last.fm, refetched every build
//   2. your writing   — src/content/{movies,books,albums}/<slug>.md, optional
//   3. recommendations — matched automatically by the URL they already link to
//
// The feed is the source of truth for facts (rating, cover, dates) and is
// rebuilt from scratch each time. Your Markdown overlay is keyed by the same
// slug and is never touched by the fetch, so anything you write survives every
// rebuild. A film/book with no overlay is still a perfectly good page; the
// overlay just adds a body, and can override the title or add related links.

export type MediaKind = 'movie' | 'book' | 'album';

export interface MediaLink {
  label: string;
  href: string;
  /** Set for internal links so templates can skip target="_blank". */
  internal?: boolean;
}

export interface MediaItem {
  kind: MediaKind;
  slug: string;
  href: string;
  title: string;
  /** Year for a film, author for a book, artist for an album. */
  subtitle?: string;
  coverUrl?: string;
  /** Normalized 0–5; half-steps only ever come from Letterboxd. */
  rating?: number;
  /** Your own review text, from the feed. */
  review?: string;
  /** Third-party blurb (Goodreads only) — never your words. */
  description?: string;
  /** The date this sorts by: last watched / date read / undefined for albums. */
  date?: Date;
  /** Human-readable status line for the card. */
  meta?: string;
  externalUrl: string;
  externalLabel: string;
  /** Films: every watch, newest first. */
  watches?: Film['watches'];
  /** Books only. */
  shelf?: Book['shelf'];
  pages?: number;
  /** Albums only. */
  playcount?: number;
  /** Markdown you wrote for this item, if any. */
  entry?: CollectionEntry<'movies'> | CollectionEntry<'books'> | CollectionEntry<'albums'>;
  /** Recommendations pointing at this item, matched by their `link`. */
  recommendations: { title: string; href: string; summary?: string; rating?: number }[];
  /** Extra links from the overlay's frontmatter. */
  links: MediaLink[];
  /**
   * Whether this item earns its own page. Films always do; books need a rating
   * or review (190 read books would otherwise be 190 near-empty pages); albums
   * need an overlay note, since Last.fm gives no rating or review to show.
   */
  hasPage: boolean;
}

const KIND_ROUTE: Record<MediaKind, string> = {
  movie: 'movies',
  book: 'books',
  album: 'albums',
};

export function mediaHref(kind: MediaKind, slug: string): string {
  return withBase(`/${KIND_ROUTE[kind]}/${slug}/`);
}

// --- Recommendation matching ----------------------------------------------

interface RecMatch {
  filmSlugs: Map<string, RecommendationEntry[]>;
  bookIds: Map<string, RecommendationEntry[]>;
}

function push<K>(map: Map<K, RecommendationEntry[]>, key: K, rec: RecommendationEntry) {
  const list = map.get(key);
  if (list) list.push(rec);
  else map.set(key, [rec]);
}

/**
 * Indexes recommendations by whatever media they already link to. No extra
 * frontmatter needed: a recommendation whose `link` is a Letterboxd film URL
 * or a Goodreads book URL is matched automatically, in both directions.
 */
function indexRecommendations(recs: RecommendationEntry[]): RecMatch {
  const filmSlugs = new Map<string, RecommendationEntry[]>();
  const bookIds = new Map<string, RecommendationEntry[]>();

  for (const rec of recs) {
    const link = rec.data.link;
    if (!link) continue;
    const film = link.match(/letterboxd\.com\/.*?\/film\/([^/?#]+)/)?.[1];
    if (film) push(filmSlugs, film, rec);
    const book = link.match(/goodreads\.com\/book\/show\/(\d+)/)?.[1];
    if (book) push(bookIds, book, rec);
  }

  return { filmSlugs, bookIds };
}

function recCards(recs: RecommendationEntry[] | undefined) {
  return (recs ?? []).map((rec) => ({
    title: rec.data.title,
    href: withBase(`/recommendations/${rec.id}/`),
    summary: rec.data.summary,
    rating: rec.data.rating,
  }));
}

// --- Overlay collections ---------------------------------------------------

type OverlayEntry = CollectionEntry<'movies'> | CollectionEntry<'books'> | CollectionEntry<'albums'>;

async function overlayMap(collection: 'movies' | 'books' | 'albums'): Promise<Map<string, OverlayEntry>> {
  const entries = (await getCollection(collection)) as OverlayEntry[];
  return new Map(entries.filter((e) => !e.data.draft).map((e) => [e.id, e]));
}

function overlayLinks(entry: OverlayEntry | undefined): MediaLink[] {
  return (entry?.data.links ?? []).map((link) => ({ label: link.label, href: link.href }));
}

// --- Builders --------------------------------------------------------------

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function filmToItem(film: Film, overlay: OverlayEntry | undefined, recs: RecommendationEntry[] | undefined): MediaItem {
  const newest = film.watches[0];
  // Rate by the most recent watch that actually carried a rating — a rewatch
  // you didn't re-rate shouldn't erase the score you gave it last time.
  const rating = film.watches.find((w) => w.rating != null)?.rating;
  const review = film.watches.find((w) => w.review)?.review;
  const rewatches = film.watches.length;

  return {
    kind: 'movie',
    slug: film.slug,
    href: mediaHref('movie', film.slug),
    title: overlay?.data.title ?? film.title,
    subtitle: film.year,
    coverUrl: film.posterUrl,
    rating,
    review,
    date: parseDate(newest?.watchedDate),
    meta: rewatches > 1 ? `watched ${rewatches}×` : newest?.rewatch ? 'rewatch' : undefined,
    externalUrl: film.url,
    externalLabel: 'Letterboxd',
    watches: film.watches,
    entry: overlay,
    recommendations: recCards(recs),
    links: overlayLinks(overlay),
    hasPage: true,
  };
}

function bookToItem(book: Book, overlay: OverlayEntry | undefined, recs: RecommendationEntry[] | undefined): MediaItem {
  const shelfLabel =
    book.shelf === 'currently-reading' ? 'reading now' : book.shelf === 'to-read' ? 'want to read' : undefined;

  return {
    kind: 'book',
    slug: book.slug,
    href: mediaHref('book', book.slug),
    title: overlay?.data.title ?? book.title,
    subtitle: book.author,
    coverUrl: book.coverUrl,
    rating: book.rating,
    review: book.review,
    description: book.description,
    date: parseDate(book.readAt),
    meta: shelfLabel,
    externalUrl: book.url,
    externalLabel: 'Goodreads',
    shelf: book.shelf,
    pages: book.pages,
    entry: overlay,
    recommendations: recCards(recs),
    links: overlayLinks(overlay),
    // 190 read books would otherwise mean 190 pages saying only title+author.
    hasPage: Boolean(book.rating || book.review || overlay),
  };
}

function albumToItem(album: Album, overlay: OverlayEntry | undefined): MediaItem {
  return {
    kind: 'album',
    slug: album.slug,
    href: mediaHref('album', album.slug),
    title: overlay?.data.title ?? album.title,
    subtitle: album.artist,
    coverUrl: album.coverUrl,
    meta: `${album.playcount.toLocaleString()} plays`,
    externalUrl: album.url,
    externalLabel: 'Last.fm',
    playcount: album.playcount,
    entry: overlay,
    recommendations: [],
    links: overlayLinks(overlay),
    // Last.fm gives no rating or review, so an album page is only worth
    // generating once you've actually written something for it.
    hasPage: Boolean(overlay),
  };
}

// --- Public API ------------------------------------------------------------

export interface MediaLibrary {
  movies: MediaItem[];
  books: MediaItem[];
  albums: MediaItem[];
}

let cached: Promise<MediaLibrary> | null = null;

/**
 * The whole library, sorted newest-first. Memoized for the lifetime of the
 * build so the six pages that need it don't each re-walk the feeds.
 */
export function getMediaLibrary(): Promise<MediaLibrary> {
  cached ??= build();
  return cached;
}

async function build(): Promise<MediaLibrary> {
  const [films, books, albums, recs, movieOverlays, bookOverlays, albumOverlays] = await Promise.all([
    getFilms(),
    getBooks(),
    getTopAlbums(),
    getAllPublishedRecommendations(),
    overlayMap('movies'),
    overlayMap('books'),
    overlayMap('albums'),
  ]);

  const index = indexRecommendations(recs);

  const movieItems = films.map((film) =>
    filmToItem(film, movieOverlays.get(film.slug), index.filmSlugs.get(film.slug))
  );
  const bookItems = books.map((book) =>
    bookToItem(book, bookOverlays.get(book.slug), book.bookId ? index.bookIds.get(book.bookId) : undefined)
  );
  const albumItems = albums.map((album) => albumToItem(album, albumOverlays.get(album.slug)));

  // A slug is a URL segment; an empty one makes getStaticPaths throw
  // "Missing parameter: slug" from deep inside Astro's router, which is a
  // miserable thing to debug. Drop them here instead.
  const routable = (items: MediaItem[]) => items.filter((item) => item.slug.trim().length > 0);

  return {
    movies: sortByDate(routable(movieItems)),
    books: sortByDate(routable(bookItems)),
    albums: routable(albumItems).sort((a, b) => (b.playcount ?? 0) - (a.playcount ?? 0)),
  };
}

function sortByDate(items: MediaItem[]): MediaItem[] {
  return [...items].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
}

/**
 * Reverse lookup for the recommendation pages: which media page, if any, does
 * this recommendation's `link` point at? Lets a recommendation link through to
 * "my full review" without any extra frontmatter.
 */
export async function getMediaForRecommendation(rec: RecommendationEntry): Promise<MediaItem | null> {
  const link = rec.data.link;
  if (!link) return null;
  const library = await getMediaLibrary();

  const filmSlug = link.match(/letterboxd\.com\/.*?\/film\/([^/?#]+)/)?.[1];
  if (filmSlug) return library.movies.find((m) => m.slug === filmSlug && m.hasPage) ?? null;

  const bookId = link.match(/goodreads\.com\/book\/show\/(\d+)/)?.[1];
  if (bookId) {
    // Match on the id we stored the slug from, not the slug itself — Goodreads
    // titles in a URL don't always match the title in the feed.
    const books = await getBooks();
    const match = books.find((b) => b.bookId === bookId);
    if (match) return library.books.find((b) => b.slug === match.slug && b.hasPage) ?? null;
  }

  return null;
}
