import { useMemo, useState } from 'react';
import type { DesktopMediaItem } from '../desktop/types';
import { useOpenDocument } from '../desktop/openDocument';

// A curated, ordered list (the "2026 Ranked" app) rather than the sortable
// grid MediaListApp shows for the full library — the whole point is that the
// order is fixed, so there's no sort control, just search.

interface Props {
  items: DesktopMediaItem[];
  /** Where "view the full list" links out to — the Letterboxd list itself. */
  listUrl: string;
}

export default function RankedListApp({ items, listUrl }: Props) {
  const [query, setQuery] = useState('');
  const openDocument = useOpenDocument();

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => item.title.toLowerCase().includes(needle));
  }, [items, query]);

  if (items.length === 0) {
    return (
      <p className="app-empty">
        Nothing here yet — drop the list export into src/data/exports/lists/ to populate it.
      </p>
    );
  }

  return (
    <div className="media-app">
      <div className="media-toolbar">
        <input
          type="search"
          className="media-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          aria-label="Search"
        />
      </div>

      <p className="media-count">
        {visible.length} of {items.length}
      </p>

      <ol className="media-grid">
        {visible.map((item) => {
          const inner = (
            <>
              <span className="media-cover">
                {item.coverUrl ? (
                  <img src={item.coverUrl} alt="" loading="lazy" />
                ) : (
                  <span className="media-cover-fallback">{item.title}</span>
                )}
              </span>
              <span className="media-title">{item.title}</span>
              {item.subtitle && <span className="media-subtitle">{item.subtitle}</span>}
              <span className="media-meta">#{item.rank}</span>
            </>
          );

          return (
            <li key={item.slug} className={item.href ? '' : 'no-page'}>
              {item.href ? (
                <a href={item.href} onClick={(e) => openDocument(item.href!, item.title, e)}>
                  {inner}
                </a>
              ) : (
                <a href={item.externalUrl} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              )}
            </li>
          );
        })}
      </ol>

      <a className="media-index-link" href={listUrl} target="_blank" rel="noopener noreferrer">
        View the full list on Letterboxd &rarr;
      </a>
    </div>
  );
}
