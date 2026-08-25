// Ported from github.com/devon-23/Spinning (script.js) — same public API key and
// request shape, restyled for Win98 chrome instead of Spinning's vinyl theme.
// Locked to a single Last.fm account per this site's scope (no visitor lookup).

export const LASTFM_USER = 'devonbarks';
const API_KEY = '092d316884d8385f35ad8b84f5f42ef8';
const API_BASE = 'https://ws.audioscrobbler.com/2.0/';
const PLACEHOLDER_HASH = '2a96cbd8b46e442fc41c2b86b821562';

const PALETTE = ['#bf5230', '#5c6b4a', '#d3992f', '#7a5c8a', '#3f6e7a', '#9c4226', '#6b7f4f'];

export function colorFor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function initial(str: string): string {
  return (str || '?').trim().charAt(0).toUpperCase() || '?';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lfm(params: Record<string, any>): Promise<any> {
  const usp = new URLSearchParams({ ...params, api_key: API_KEY, format: 'json' });
  const res = await fetch(API_BASE + '?' + usp.toString());
  const data = await res.json().catch(() => null);
  if (!data) throw new Error("Couldn't reach Last.fm.");
  if (data.error) throw new Error(data.message || 'Last.fm error.');
  return data;
}

export interface LastfmImage {
  size: string;
  '#text': string;
}

export function bestImage(imgArr: LastfmImage[] | undefined, size = 'extralarge'): string | null {
  if (!Array.isArray(imgArr)) return null;
  const order = ['extralarge', 'large', 'medium', 'small'];
  const tryOrder = [size, ...order.filter((s) => s !== size)];
  for (const sz of tryOrder) {
    const found = imgArr.find((im) => im.size === sz);
    if (found && found['#text'] && !found['#text'].includes(PLACEHOLDER_HASH)) {
      return found['#text'];
    }
  }
  return null;
}

export function timeAgo(unixSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  let diff = now - unixSeconds;
  if (diff < 0) diff = 0;
  const mins = Math.floor(diff / 60);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + 'd ago';
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function trimSummary(summary?: string): string {
  if (!summary) return '';
  const cut = summary.indexOf('<a');
  const text = cut > -1 ? summary.slice(0, cut) : summary;
  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent?.trim() ?? '';
}

export function artistNameOf(artist: any): string {
  return (artist && (artist['#text'] || artist.name)) || 'Unknown artist';
}
