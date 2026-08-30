import { useEffect, useState } from 'react';
import { lfm, bestImage, timeAgo, artistNameOf, LASTFM_USER } from './lastfmClient';

// Ported from github.com/devon-23/nowPlaying (app.js) — same polling shape:
// re-read user.getrecenttracks every 10s, and when the top track changes, pull
// its duration from track.getInfo so the progress bar can tick locally between
// polls. Last.fm doesn't expose a playback position, so elapsed time is our own
// estimate that resets whenever a new track appears.
//
// The poller is a module-level singleton, not per-component state: the ticker,
// the desktop gadget, the Currently window and the Profile window all want this
// data at once, and four independent hooks would mean four requests every 10
// seconds against the same public API key. Instead one poller runs while at
// least one component is mounted, and every subscriber sees the same object.

const POLL_MS = 10_000;
const TICK_MS = 1000;
const FALLBACK_DURATION_MS = 180_000;

export interface NowPlayingState {
  status: 'loading' | 'error' | 'ready';
  error: string;
  /** True only while Last.fm reports an active `nowplaying` scrobble. */
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  coverUrl: string | null;
  trackUrl: string;
  /** "playing now" / "last spun 4h ago" — ready for display. */
  statusText: string;
  /** 0–100. Estimated, and only meaningful while `isPlaying`. */
  progress: number;
  elapsedLabel: string;
  durationLabel: string;
  /** The 5 scrobbles before the current one. */
  recent: { title: string; artist: string; when: string }[];
}

const INITIAL: NowPlayingState = {
  status: 'loading',
  error: '',
  isPlaying: false,
  title: '',
  artist: '',
  album: '',
  coverUrl: null,
  trackUrl: `https://www.last.fm/user/${LASTFM_USER}`,
  statusText: 'checking…',
  progress: 0,
  elapsedLabel: '0:00',
  durationLabel: '3:00',
  recent: [],
};

function clockLabel(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// --- The singleton ---------------------------------------------------------

let state: NowPlayingState = INITIAL;
const listeners = new Set<(s: NowPlayingState) => void>();

let pollTimer: number | null = null;
let tickTimer: number | null = null;
let subscriberCount = 0;

// Playback estimate. Last.fm gives no position, so we count locally from the
// moment a new track first appears and reset when the track changes.
let elapsedMs = 0;
let durationMs = FALLBACK_DURATION_MS;
let currentKey: string | null = null;

function publish(patch: Partial<NowPlayingState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener(state);
}

async function poll() {
  try {
    const data = await lfm({ method: 'user.getrecenttracks', user: LASTFM_USER, limit: 6 });

    const raw = data.recenttracks?.track;
    const tracks: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const track = tracks[0];

    if (!track) {
      publish({ status: 'ready', isPlaying: false, statusText: 'no scrobbles yet' });
      return;
    }

    const isPlaying = track['@attr']?.nowplaying === 'true';
    const artist = artistNameOf(track.artist);
    const title = track.name || 'Untitled';
    const key = `${artist} — ${title}`;

    // New track: reset the local clock and re-read the real duration.
    if (key !== currentKey) {
      currentKey = key;
      elapsedMs = 0;
      durationMs = FALLBACK_DURATION_MS;

      lfm({ method: 'track.getInfo', artist, track: title })
        .then((info) => {
          // A slow getInfo can land after the song already changed — only apply
          // it if we're still on the track it was requested for.
          if (currentKey !== key) return;
          const ms = Number(info?.track?.duration || 0);
          if (ms > 0) durationMs = ms;
        })
        .catch(() => {
          /* keep the 3:00 fallback */
        });
    }

    const uts = track.date?.uts ? Number(track.date.uts) : null;

    publish({
      status: 'ready',
      error: '',
      isPlaying,
      title,
      artist,
      album: track.album?.['#text'] || '',
      coverUrl: bestImage(track.image),
      trackUrl: track.url || state.trackUrl,
      statusText: isPlaying ? 'playing now' : uts ? `last spun ${timeAgo(uts)}` : 'not currently playing',
      recent: tracks.slice(1, 6).map((t) => ({
        title: t.name,
        artist: artistNameOf(t.artist),
        when: t.date?.uts ? timeAgo(Number(t.date.uts)) : 'now',
      })),
    });
  } catch (err: any) {
    publish({ status: 'error', error: err?.message || 'Last.fm is not answering.' });
  }
}

function tick() {
  if (!state.isPlaying) return;
  elapsedMs += TICK_MS;
  if (elapsedMs >= durationMs) elapsedMs = 0;
  publish({
    progress: Math.min(100, (elapsedMs / durationMs) * 100),
    elapsedLabel: clockLabel(elapsedMs),
    durationLabel: clockLabel(durationMs),
  });
}

function subscribe(listener: (s: NowPlayingState) => void): () => void {
  listeners.add(listener);
  subscriberCount += 1;

  if (subscriberCount === 1) {
    poll();
    pollTimer = window.setInterval(poll, POLL_MS);
    tickTimer = window.setInterval(tick, TICK_MS);
  }

  return () => {
    listeners.delete(listener);
    subscriberCount -= 1;
    // Last component unmounted — stop hitting the API until something needs it.
    if (subscriberCount === 0) {
      if (pollTimer !== null) window.clearInterval(pollTimer);
      if (tickTimer !== null) window.clearInterval(tickTimer);
      pollTimer = tickTimer = null;
    }
  };
}

/**
 * The current Last.fm track, shared across every component that asks. Safe to
 * call from as many components as you like — they all share one poller.
 */
export function useNowPlaying(): NowPlayingState {
  const [local, setLocal] = useState(state);
  useEffect(() => subscribe(setLocal), []);
  return local;
}
