export interface Badge {
  id: string;
  src: string;
  alt: string;
  href?: string;
}

// Classic 88x31 pixel "web badges" — path is base-relative, run it through
// withBase() (or Astro's normal asset handling) wherever it's rendered.
export const BADGES: Badge[] = [
  { id: 'github', src: '/badges/github.svg', alt: 'GitHub', href: 'https://github.com/devon-23' },
  { id: 'lastfm', src: '/badges/lastfm.svg', alt: 'Spinning on Last.fm', href: 'https://www.last.fm/user/devonbarks' },
  { id: 'astro', src: '/badges/astro.svg', alt: 'Made with Astro', href: 'https://astro.build' },
  { id: 'best-viewed', src: '/badges/best-viewed.svg', alt: 'Best viewed at 1024x768' },
];
