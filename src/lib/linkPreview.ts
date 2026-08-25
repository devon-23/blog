import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Runs at build time (this file is only ever imported from .astro
// frontmatter, never shipped to the client). Detects a few link types we
// can embed directly (YouTube, Spotify), and otherwise fetches the page's
// Open Graph metadata so things like a Letterboxd film link, an IMDb page,
// a Goodreads book, etc. show up as a real preview card — poster image,
// title, description — instead of a bare "visit link" anchor.
//
// Fetching is cached to disk (.cache/link-previews/) so repeated local
// builds don't keep re-hitting the same URLs, and any failure (network,
// timeout, a site blocking bots) just falls back to a plain link rather
// than breaking the build.

export type LinkPreview =
  | { type: 'youtube'; url: string; youtubeId: string }
  | { type: 'spotify'; url: string; embedUrl: string }
  | { type: 'og'; url: string; title?: string; description?: string; image?: string; siteName?: string }
  | { type: 'none'; url: string };

// process.cwd() is the project root for every context this runs in (astro
// build/dev/preview are always invoked from there) — more reliable than
// import.meta.url, which Vite can rewrite under SSG bundling.
const CACHE_DIR = join(process.cwd(), '.cache', 'link-previews');

function cachePathFor(url: string): string {
  const hash = createHash('sha1').update(url).digest('hex');
  return join(CACHE_DIR, `${hash}.json`);
}

function readCache(url: string): LinkPreview | null {
  try {
    const path = cachePathFor(url);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

function writeCache(url: string, preview: LinkPreview) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(cachePathFor(url), JSON.stringify(preview));
  } catch {
    // Cache is a pure optimization — ignore write failures (e.g. read-only CI fs).
  }
}

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] ?? null;
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] ?? null;
    }
  } catch {
    // fall through
  }
  return null;
}

function extractSpotifyEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('open.spotify.com')) return null;
    return `https://open.spotify.com${u.pathname.replace(/^\/(track|album|playlist|artist|episode|show)\//, '/embed/$1/')}`;
  } catch {
    return null;
  }
}

function metaTag(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i'),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match) return decodeHtmlEntities(match[1]);
  }
  return undefined;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function fetchOgPreview(url: string): Promise<LinkPreview> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; devon98-link-preview/1.0)' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const titleTag = html.match(/<title>([^<]*)<\/title>/i)?.[1];

  return {
    type: 'og',
    url,
    title: metaTag(html, 'og:title') || (titleTag ? decodeHtmlEntities(titleTag) : undefined),
    description: metaTag(html, 'og:description') || metaTag(html, 'description'),
    image: metaTag(html, 'og:image'),
    siteName: metaTag(html, 'og:site_name'),
  };
}

export async function getLinkPreview(url: string): Promise<LinkPreview> {
  const youtubeId = extractYoutubeId(url);
  if (youtubeId) return { type: 'youtube', url, youtubeId };

  const spotifyEmbed = extractSpotifyEmbed(url);
  if (spotifyEmbed) return { type: 'spotify', url, embedUrl: spotifyEmbed };

  const cached = readCache(url);
  if (cached) return cached;

  try {
    const preview = await fetchOgPreview(url);
    writeCache(url, preview);
    return preview;
  } catch {
    const fallback: LinkPreview = { type: 'none', url };
    writeCache(url, fallback); // avoid re-hitting a dead/blocking URL every build
    return fallback;
  }
}
