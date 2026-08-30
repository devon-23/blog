export interface Badge {
  id: string;
  src: string;
  alt: string;
  href?: string;
}

// Classic 88x31 pixel "web badges" — path is base-relative, run it through
// withBase() (or Astro's normal asset handling) wherever it's rendered.
// The first three also show on the desktop itself (see Desktop.tsx), so keep
// the ones worth seeing at a glance at the top of the list.
export const BADGES: Badge[] = [
  { id: 'lastfm', src: '/badges/lastfm.svg', alt: 'Spinning on Last.fm', href: 'https://www.last.fm/user/devonbarks' },
  { id: 'letterboxd', src: '/badges/letterboxd.svg', alt: 'Watching on Letterboxd', href: 'https://letterboxd.com/devonbarks/' },
  { id: 'goodreads', src: '/badges/goodreads.svg', alt: 'Reading on Goodreads', href: 'https://www.goodreads.com/user/show/46321023-devon' },
  { id: 'github', src: '/badges/github.svg', alt: 'GitHub', href: 'https://github.com/devon-23' },
  { id: 'guestbook', src: '/badges/guestbook.svg', alt: 'Sign my guestbook' },
  { id: 'handmade', src: '/badges/handmade.svg', alt: 'Handmade — no templates here' },
  { id: 'astro', src: '/badges/astro.svg', alt: 'Made with Astro', href: 'https://astro.build' },
  { id: 'netscape', src: '/badges/netscape.svg', alt: 'Best viewed with any browser' },
  { id: 'best-viewed', src: '/badges/best-viewed.svg', alt: 'Best viewed at 1024x768' },
];
