// Every external account this site reads from, in one place. Change a handle
// here and the Now Playing gadget, the Currently window, and the Profile
// window all follow.
//
// Letterboxd and Goodreads are pulled at BUILD time (see src/lib/feeds.ts) —
// both expose keyless public RSS, so there's no token to keep secret, but it
// also means those panels only refresh when the site rebuilds. Last.fm is
// pulled in the browser so "now playing" can actually be live.

export const PROFILES = {
  lastfm: {
    user: 'devonbarks',
    url: 'https://www.last.fm/user/devonbarks',
    // Last.fm API keys are public by design (read-only, rate-limited, visible
    // in every browser request the Music window makes) — this is not a secret.
    apiKey: '092d316884d8385f35ad8b84f5f42ef8',
  },
  letterboxd: {
    user: 'devonbarks',
    url: 'https://letterboxd.com/devonbarks/',
    rss: 'https://letterboxd.com/devonbarks/rss/',
    // List and watchlist RSS sit behind a Cloudflare bot challenge that a
    // build-time fetch can't pass (the diary RSS above is exempt), so ranked
    // lists come from the export CSV in src/data/exports/lists/ instead — see
    // getRankedListSlugs() in lib/feeds.ts.
    lists: {
      ranked2026: { slug: '2026-ranked', title: '2026 Ranked', url: 'https://letterboxd.com/devonbarks/list/2026-ranked/' },
    },
  },
  goodreads: {
    userId: '46321023',
    url: 'https://www.goodreads.com/user/show/46321023-devon',
    // Keyless RSS. `shelf` is appended by the fetcher.
    rssBase: 'https://www.goodreads.com/review/list_rss/46321023',
  },
  github: {
    user: 'devon-23',
    url: 'https://github.com/devon-23',
  },
} as const;

// ---------------------------------------------------------------------------
// The MySpace-style profile. This is the "about me" that shows up in the
// Profile window — edit it freely, it's all just text.
// ---------------------------------------------------------------------------

export interface ProfileFriend {
  name: string;
  blurb: string;
  href?: string;
  /** Two initials-ish characters used for the pixel avatar tile. */
  tag: string;
}

export const PROFILE = {
  displayName: 'devonnn',
  tagline: 'this is my corner of the internet',
  /** Shows up next to the mood face in the profile header. */
  mood: 'caffeinated',
  moodEmoji: '☕',
  location: 'somewhere with bad wifi',
  status: 'online',

  blurb: [
    "Hi, I'm Devonnn. This is my desktop — a running log of what I'm reading, cooking, listening to, thinking about, and planning next.",
    'Everything here is append-only. Nothing gets deleted, only added to, which means the bad takes stay up right next to the good ones.',
  ],

  /** The classic "General / Music / Movies / Books" interests table. */
  interests: [
    { label: 'General', value: 'long walks with a podcast on, cooking something slightly too ambitious, the exact moment an album clicks' },
    { label: 'Music', value: 'whatever the Music window says — it is not lying, it is scrobbled' },
    { label: 'Movies', value: 'anything I can talk about for an hour afterwards' },
    { label: 'Books', value: 'literary fiction, the occasional 900-page fantasy brick' },
    { label: 'Heroes', value: 'people who finish the side project' },
  ],

  /** MySpace Top 8. Swap these for real people, or keep them as things you love. */
  topFriends: [
    { name: 'Last.fm', tag: 'FM', blurb: 'knows more about me than I do', href: 'https://www.last.fm/user/devonbarks' },
    { name: 'Letterboxd', tag: 'LB', blurb: 'the movie diary', href: 'https://letterboxd.com/devonbarks/' },
    { name: 'Goodreads', tag: 'GR', blurb: 'the guilt tracker', href: 'https://www.goodreads.com/user/show/46321023-devon' },
    { name: 'GitHub', tag: '{}', blurb: 'where this site lives', href: 'https://github.com/devon-23' },
    { name: 'Coffee', tag: '☕', blurb: 'load-bearing' },
    { name: 'Astro', tag: '★', blurb: 'builds the whole thing', href: 'https://astro.build' },
    { name: 'Win98', tag: '98', blurb: 'peak interface design' },
    { name: 'You', tag: ':)', blurb: 'thanks for scrolling' },
  ] satisfies ProfileFriend[],
} as const;
