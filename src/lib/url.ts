/**
 * Prefixes a site-relative path with Astro's configured base path
 * (`/blog` on GitHub Pages). Astro does NOT auto-prefix anything under
 * `public/`, so every hand-written internal link/icon/asset reference must
 * go through this helper instead of a hardcoded leading-slash path.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
