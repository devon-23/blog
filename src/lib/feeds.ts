import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
// Explicit .ts extension (allowed by astro/tsconfigs/base's
// allowImportingTsExtensions) so `scripts/new-media-note.mjs` can import this
// module directly under plain Node, which has no bundler to resolve
// extensionless paths for it.
import { PROFILES } from '../data/profiles.ts';

// Build-time only (imported from .astro frontmatter, never shipped to the
// client). Letterboxd and Goodreads both publish keyless public RSS, so
// "last film I watched" and "last book I finished" can be baked into the
// static build with no API key and no client-side CORS problem.
//
// RSS is the live path but it is TRUNCATED: Letterboxd's diary feed carries
// only the most recent 50 entries. To keep a full history, drop the official
// export files into `src/data/exports/` (see EXPORTS_DIR below) — those are
// read from disk and merged with the feed, feed winning on overlap because it
// carries poster art the exports don't. See README "Full history".
//
// Everything is cached to disk so repeated local builds don't hammer the
// feeds, and any failure degrades to an empty list rather than breaking the
// build. Deploys run in fresh CI checkouts with no cache, so a production
// build always fetches fresh.

const CACHE_DIR = join(process.cwd(), '.cache', 'feeds');
const EXPORTS_DIR = join(process.cwd(), 'src', 'data', 'exports');
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6h — plenty fresh for a static site
// Bump whenever the SHAPE of anything cached below changes. The cache key is
// otherwise just the source URL, so without this an old entry parsed by an
// older version of this file is silently deserialized into the new types and
// the build quietly works with garbage. (Learned the hard way.)
const CACHE_VERSION = 2;
const FETCH_TIMEOUT_MS = 10_000;
const UA = 'Mozilla/5.0 (compatible; devon98-feeds/1.0)';

interface CacheEnvelope<T> {
  fetchedAt: number;
  value: T;
}

function cachePathFor(key: string): string {
  const hash = createHash('sha1').update(`v${CACHE_VERSION}:${key}`).digest('hex');
  return join(CACHE_DIR, `${hash}.json`);
}

function readCache<T>(key: string): T | null {
  try {
    const path = cachePathFor(key);
    if (!existsSync(path)) return null;
    const envelope: CacheEnvelope<T> = JSON.parse(readFileSync(path, 'utf-8'));
    if (Date.now() - envelope.fetchedAt > CACHE_TTL_MS) return null;
    return envelope.value;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const envelope: CacheEnvelope<T> = { fetchedAt: Date.now(), value };
    writeFileSync(cachePathFor(key), JSON.stringify(envelope));
  } catch {
    // Cache is a pure optimization — ignore write failures (read-only CI fs).
  }
}

/**
 * Runs `fn` over `items` with at most `limit` in flight at once. Firing a full
 * export's worth of boxd.it redirect lookups (900+ URLs) as one Promise.all
 * gets Cloudflare to answer nearly all of them with 429 — throttling keeps
 * every request under the rate limit instead.
 */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// --- Tiny RSS helpers ------------------------------------------------------
// These feeds are machine-generated and well-formed enough that regex beats
// pulling in an XML parser dependency for a handful of fields.

function itemsOf(xml: string): string[] {
  return xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
}

function unwrapCdata(raw: string): string {
  return raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

/** The raw inner text of a tag, CDATA unwrapped but HTML left intact. */
function rawTag(item: string, name: string): string | undefined {
  const match = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? unwrapCdata(match[1]) || undefined : undefined;
}

function tag(item: string, name: string): string | undefined {
  const raw = rawTag(item, name);
  return raw ? decodeEntities(raw) : undefined;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(html: string | undefined): string {
  if (!html) return '';
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/['"’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// --- CSV ------------------------------------------------------------------

/**
 * A minimal RFC-4180 reader — enough for Letterboxd and Goodreads exports,
 * whose review columns routinely contain commas, quotes and newlines.
 */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  const body = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');

  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (quoted) {
      if (char === '"') {
        if (body[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const header = rows.shift();
  if (!header) return [];
  return rows
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

/**
 * Reads a CSV out of `src/data/exports/`, matching the filename
 * case-insensitively. Returns [] when the file isn't there — exports are
 * entirely optional, so a missing file is the normal case, not an error.
 */
function readExportCsv(filename: string): Record<string, string>[] {
  try {
    if (!existsSync(EXPORTS_DIR)) return [];
    const target = readdirSync(EXPORTS_DIR).find((f) => f.toLowerCase() === filename.toLowerCase());
    if (!target) return [];
    return parseCsv(readFileSync(join(EXPORTS_DIR, target), 'utf-8'));
  } catch {
    return [];
  }
}

/**
 * A list export isn't a plain CSV of films — it opens with a few metadata
 * lines (export version, then a Date/Name/Tags/URL/Description row for the
 * list itself) before the blank line and the real per-film header
 * (`Position,Name,Year,URL,Description`). Skip down to that header so the
 * rest can be parsed as normal CSV.
 */
function filmSectionOf(raw: string): string {
  const body = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const lines = body.split('\n');
  const headerIndex = lines.findIndex((line) => line.startsWith('Position,'));
  return headerIndex === -1 ? body : lines.slice(headerIndex).join('\n');
}

/**
 * Letterboxd's exports (list exports, and diary/ratings/watched/reviews)
 * link films via shortened `boxd.it/xxxx` URLs rather than the full
 * `/film/<slug>/` page, so the real slug has to be resolved by following the
 * redirect. Cached to disk since a short link's target never changes.
 *
 * A full export resolves 900+ of these short links in one build, which is
 * enough to trip boxd.it's Cloudflare rate limit (HTTP 429) even throttled to
 * a handful in flight at once — so a 429 gets a couple of backed-off retries
 * before giving up. A give-up is never cached (only a real slug is), so the
 * next build just tries again instead of being stuck on a stale null.
 */
async function resolveFilmSlug(url: string): Promise<string | null> {
  const direct = filmSlugFromUrl(url);
  if (direct) return direct;
  if (!url) return null;

  const cacheKey = `boxd-redirect:${url}`;
  const cached = readCache<string | null>(cacheKey);
  if (cached !== null) return cached;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (res.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 750 * 2 ** attempt));
        continue;
      }
      const slug = filmSlugFromUrl(res.url);
      writeCache(cacheKey, slug);
      return slug;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Film slugs from a Letterboxd list export (`src/data/exports/lists/<slug>.csv`),
 * in the list's own rank order — that's just row order in the file, which is
 * how Letterboxd's export already writes it, so no rank column is required.
 * List RSS is behind a Cloudflare challenge a build-time fetch can't pass, so
 * this export is the only source for list data. Returns [] when the file
 * isn't there, same as any other export.
 */
export async function getRankedListSlugs(slug: string): Promise<string[]> {
  try {
    const dir = join(EXPORTS_DIR, 'lists');
    if (!existsSync(dir)) return [];
    const target = readdirSync(dir).find((f) => f.toLowerCase() === `${slug.toLowerCase()}.csv`);
    if (!target) return [];
    const urls = parseCsv(filmSectionOf(readFileSync(join(dir, target), 'utf-8')))
      .map((row) => row['URL'] || '')
      .filter(Boolean);
    const slugs = await mapWithConcurrency(urls, 10, resolveFilmSlug);
    return slugs.filter((s): s is string => Boolean(s));
  } catch {
    return [];
  }
}

// --- Letterboxd ------------------------------------------------------------

/** One diary entry — a single watch. A rewatched film has several. */
export interface FilmWatch {
  /** ISO date (YYYY-MM-DD) the film was watched. */
  watchedDate?: string;
  /** 0.5–5 in half-star steps; undefined for an unrated log. */
  rating?: number;
  review?: string;
  rewatch: boolean;
  /** The diary entry's own Letterboxd URL. */
  url: string;
}

export interface Film {
  slug: string;
  title: string;
  year?: string;
  posterUrl?: string;
  /** The film's Letterboxd page (not a specific diary entry). */
  url: string;
  /** Newest first. */
  watches: FilmWatch[];
}

/** `https://letterboxd.com/devonbarks/film/a-real-pain/7/` → `a-real-pain` */
function filmSlugFromUrl(url: string): string | null {
  return url.match(/\/film\/([^/?#]+)/)?.[1] ?? null;
}

function filmPageUrl(slug: string): string {
  return `https://letterboxd.com/film/${slug}/`;
}

interface RawWatch extends FilmWatch {
  slug: string;
  title: string;
  year?: string;
  posterUrl?: string;
}

async function letterboxdFromRss(): Promise<RawWatch[]> {
  const url = PROFILES.letterboxd.rss;
  const cached = readCache<RawWatch[]>(url);
  if (cached) return cached;

  try {
    const xml = await fetchText(url);
    const watches: RawWatch[] = [];

    for (const item of itemsOf(xml)) {
      const title = tag(item, 'letterboxd:filmTitle');
      const entryUrl = tag(item, 'link');
      if (!title || !entryUrl) continue; // a published list, not a diary entry

      const slug = filmSlugFromUrl(entryUrl);
      if (!slug) continue;

      const description = rawTag(item, 'description') ?? '';
      const posterUrl = description.match(/<img src="([^"]+)"/)?.[1];
      // The poster <img> is always the first element; the rest is the review.
      const review = stripHtml(description.replace(/<p>\s*<img[^>]*>\s*<\/p>/i, ''));
      const ratingRaw = tag(item, 'letterboxd:memberRating');

      watches.push({
        slug,
        title,
        year: tag(item, 'letterboxd:filmYear'),
        posterUrl,
        rating: ratingRaw ? Number(ratingRaw) : undefined,
        review: review || undefined,
        watchedDate: tag(item, 'letterboxd:watchedDate'),
        rewatch: tag(item, 'letterboxd:rewatch') === 'Yes',
        url: entryUrl,
      });
    }

    writeCache(url, watches);
    return watches;
  } catch {
    return [];
  }
}

/**
 * Reads whatever Letterboxd export files are present. `diary.csv` carries the
 * watch dates and `reviews.csv` the review text; `ratings.csv` and
 * `watched.csv` are thinner fallbacks for films missing from the other two.
 * Exports have no poster art — those films show a text placeholder until the
 * film reappears in the RSS window.
 *
 * Like list exports, these link films via `boxd.it` short URLs rather than
 * `/film/<slug>/` — resolved through the same redirect-following, disk-cached
 * resolveFilmSlug(). URIs are deduped first since the same short link repeats
 * across files (and across every diary/rating/watched row for a film that was
 * never rewatched).
 */
async function letterboxdFromExports(): Promise<RawWatch[]> {
  const rows: { row: Record<string, string>; review?: string }[] = [
    ...readExportCsv('reviews.csv').map((row) => ({ row, review: row.Review })),
    ...readExportCsv('diary.csv').map((row) => ({ row })),
    ...readExportCsv('ratings.csv').map((row) => ({ row })),
    ...readExportCsv('watched.csv').map((row) => ({ row })),
  ];

  const uris = [...new Set(rows.map(({ row }) => row['Letterboxd URI'] || '').filter(Boolean))];
  const resolved = await mapWithConcurrency(uris, 10, async (uri) => [uri, await resolveFilmSlug(uri)] as const);
  const slugByUri = new Map(resolved);

  return rows
    .map(({ row, review }): RawWatch | null => {
      const uri = row['Letterboxd URI'] || '';
      const slug = slugByUri.get(uri) ?? null;
      const title = row.Name;
      if (!slug || !title) return null;
      const ratingRaw = Number(row.Rating);
      return {
        slug,
        title,
        year: row.Year || undefined,
        rating: Number.isFinite(ratingRaw) && ratingRaw > 0 ? ratingRaw : undefined,
        review: review || undefined,
        watchedDate: row['Watched Date'] || row.Date || undefined,
        rewatch: row.Rewatch === 'Yes',
        url: uri,
      };
    })
    .filter((w): w is RawWatch => w !== null);
}

/** Every film, grouped by slug with all its watches, newest watch first. */
export async function getFilms(): Promise<Film[]> {
  const [rss, exported] = await Promise.all([letterboxdFromRss(), letterboxdFromExports()]);

  const byFilm = new Map<string, Film>();
  // RSS first so its poster/metadata wins; exports then fill in the history.
  for (const watch of [...rss, ...exported]) {
    let film = byFilm.get(watch.slug);
    if (!film) {
      film = {
        slug: watch.slug,
        title: watch.title,
        year: watch.year,
        posterUrl: watch.posterUrl,
        url: filmPageUrl(watch.slug),
        watches: [],
      };
      byFilm.set(watch.slug, film);
    }
    film.posterUrl ??= watch.posterUrl;
    film.year ??= watch.year;

    // The same watch can arrive from both RSS and an export. Dedupe on the
    // watch date, preferring whichever copy actually carries review text.
    const key = watch.watchedDate ?? watch.url;
    const existing = film.watches.find((w) => (w.watchedDate ?? w.url) === key);
    if (existing) {
      existing.review ??= watch.review;
      existing.rating ??= watch.rating;
      continue;
    }
    film.watches.push({
      watchedDate: watch.watchedDate,
      rating: watch.rating,
      review: watch.review,
      rewatch: watch.rewatch,
      url: watch.url,
    });
  }

  for (const film of byFilm.values()) {
    film.watches.sort((a, b) => (b.watchedDate ?? '').localeCompare(a.watchedDate ?? ''));
  }

  return [...byFilm.values()];
}

// --- Goodreads -------------------------------------------------------------

export interface Book {
  slug: string;
  /** Goodreads' numeric book id — how recommendation links are matched. */
  bookId?: string;
  title: string;
  author: string;
  /** 1–5 whole stars, or undefined if unrated (always so while reading). */
  rating?: number;
  coverUrl?: string;
  /** Goodreads' blurb, not the user's. */
  description?: string;
  /** The user's own review text, if they wrote one. */
  review?: string;
  readAt?: string;
  pages?: number;
  published?: string;
  shelf: 'read' | 'currently-reading' | 'to-read';
  url: string;
}

/** Series suffixes make for ugly, unstable slugs — drop them. */
function bookSlug(title: string, bookId?: string): string {
  const base = slugify(title.replace(/\s*\([^)]*#[^)]*\)\s*$/, ''));
  return base || slugify(`book-${bookId ?? 'untitled'}`);
}

function goodreadsFromRss(xml: string, shelf: Book['shelf']): Book[] {
  return itemsOf(xml).map((item) => {
    const ratingRaw = Number(tag(item, 'user_rating') ?? 0);
    const pagesRaw = Number(tag(item, 'num_pages') ?? 0);
    const bookId = tag(item, 'book_id');
    const title = tag(item, 'title') ?? 'Untitled';
    // The default cover is a postage-stamp _SY75_ crop; the large variant is
    // the same image without the resize segment.
    const coverUrl = tag(item, 'book_large_image_url') || tag(item, 'book_image_url');

    return {
      slug: bookSlug(title, bookId),
      bookId,
      title,
      author: tag(item, 'author_name') ?? 'Unknown author',
      rating: ratingRaw > 0 ? ratingRaw : undefined,
      coverUrl,
      description: truncate(stripHtml(tag(item, 'book_description')), 400),
      review: stripHtml(tag(item, 'user_review')) || undefined,
      readAt: tag(item, 'user_read_at') || tag(item, 'user_date_added'),
      pages: pagesRaw > 0 ? pagesRaw : undefined,
      published: tag(item, 'book_published'),
      shelf,
      url: bookId ? `https://www.goodreads.com/book/show/${bookId}` : PROFILES.goodreads.url,
    };
  });
}

/**
 * A whole shelf, following pagination. Goodreads caps a page at 100 items and
 * returns an empty channel past the end, so we walk until a page comes back
 * short (with a hard stop, so a misbehaving feed can't loop forever).
 */
export async function getShelf(shelf: Book['shelf']): Promise<Book[]> {
  const sort = shelf === 'read' ? '&sort=date_read&order=d' : '';
  const cacheKey = `goodreads:${shelf}`;
  const cached = readCache<Book[]>(cacheKey);
  if (cached) return cached;

  const books: Book[] = [];
  try {
    for (let page = 1; page <= 10; page++) {
      const xml = await fetchText(`${PROFILES.goodreads.rssBase}?shelf=${shelf}${sort}&page=${page}`);
      const batch = goodreadsFromRss(xml, shelf);
      books.push(...batch);
      if (batch.length < 100) break;
    }
    writeCache(cacheKey, books);
    return books;
  } catch {
    // Keep whatever pages did come back rather than losing the lot.
    return books;
  }
}

/**
 * The Goodreads CSV export (`goodreads_library_export.csv`), which carries
 * full review text and every shelf in one file. Optional — see EXPORTS_DIR.
 */
function goodreadsFromExport(): Book[] {
  return readExportCsv('goodreads_library_export.csv')
    .map((row) => {
      const title = row.Title || 'Untitled';
      const bookId = row['Book Id'] || undefined;
      const shelfRaw = row['Exclusive Shelf'] || 'read';
      const shelf: Book['shelf'] =
        shelfRaw === 'currently-reading' || shelfRaw === 'to-read' ? shelfRaw : 'read';
      const rating = Number(row['My Rating'] || 0);
      const pages = Number(row['Number of Pages'] || 0);

      return {
        slug: bookSlug(title, bookId),
        bookId,
        title,
        author: row.Author || 'Unknown author',
        rating: rating > 0 ? rating : undefined,
        coverUrl: undefined, // the export carries no cover art
        description: undefined,
        review: stripHtml(row['My Review']) || undefined,
        readAt: row['Date Read'] || row['Date Added'] || undefined,
        pages: pages > 0 ? pages : undefined,
        published: row['Original Publication Year'] || row['Year Published'] || undefined,
        shelf,
        url: bookId ? `https://www.goodreads.com/book/show/${bookId}` : PROFILES.goodreads.url,
      } satisfies Book;
    })
    .filter((b) => b.title !== 'Untitled');
}

/** Every book across every shelf, RSS merged with the optional export. */
export async function getBooks(): Promise<Book[]> {
  const [read, reading, toRead] = await Promise.all([
    getShelf('read'),
    getShelf('currently-reading'),
    getShelf('to-read'),
  ]);

  const byBook = new Map<string, Book>();
  // RSS first: it has covers and blurbs the export lacks.
  for (const book of [...read, ...reading, ...toRead, ...goodreadsFromExport()]) {
    const existing = byBook.get(book.slug);
    if (!existing) {
      byBook.set(book.slug, { ...book });
      continue;
    }
    existing.coverUrl ??= book.coverUrl;
    existing.description ??= book.description;
    existing.review ??= book.review;
    existing.rating ??= book.rating;
    existing.pages ??= book.pages;
    existing.readAt ??= book.readAt;
  }

  return [...byBook.values()];
}

// --- Last.fm ---------------------------------------------------------------

export interface Album {
  slug: string;
  title: string;
  artist: string;
  playcount: number;
  coverUrl?: string;
  url: string;
}

/**
 * Top albums of all time. Unlike films and books there's no rating or review
 * here — just play counts — so these are index rows until you write an
 * `src/content/albums/<slug>.md` note for one.
 */
export async function getTopAlbums(limit = 60): Promise<Album[]> {
  const url =
    `https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${PROFILES.lastfm.user}` +
    `&api_key=${PROFILES.lastfm.apiKey}&format=json&period=overall&limit=${limit}`;
  const cached = readCache<Album[]>(url);
  if (cached) return cached;

  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    const data = await res.json();
    const raw = data?.topalbums?.album;
    const list: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

    const albums: Album[] = list.map((item) => {
      const artist = item.artist?.name ?? 'Unknown artist';
      const title = item.name ?? 'Untitled';
      const images: any[] = Array.isArray(item.image) ? item.image : [];
      const cover = ['extralarge', 'large', 'medium']
        .map((size) => images.find((im) => im.size === size)?.['#text'])
        .find((src) => src && !src.includes('2a96cbd8b46e442fc41c2b86b821562'));

      return {
        slug: slugify(`${artist}-${title}`),
        title,
        artist,
        playcount: Number(item.playcount || 0),
        coverUrl: cover || undefined,
        url: item.url || PROFILES.lastfm.url,
      };
    });

    writeCache(url, albums);
    return albums;
  } catch {
    return [];
  }
}

// --- Helpers ---------------------------------------------------------------

function truncate(text: string, max: number): string | undefined {
  if (!text) return undefined;
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(' ', max)).trimEnd() + '…';
}
