import { useMemo, useState } from 'react';
import type { DesktopMediaItem } from '../desktop/types';
import { useOpenDocument } from '../desktop/openDocument';

// The Movies / Books / Albums windows. One component, three configurations —
// the only real differences are which sorts make sense and what the empty
// state says.

export type MediaSort = 'newest' | 'oldest' | 'rating' | 'title' | 'plays';

interface Props {
  items: DesktopMediaItem[];
  kind: 'movie' | 'book' | 'album';
  indexHref: string;
}

const SORT_LABELS: Record<MediaSort, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  rating: 'Highest rated',
  title: 'A–Z',
  plays: 'Most played',
};

const SORTS_FOR: Record<Props['kind'], MediaSort[]> = {
  movie: ['newest', 'oldest', 'rating', 'title'],
  book: ['newest', 'oldest', 'rating', 'title'],
  album: ['plays', 'title'],
};

export function sortItems(items: DesktopMediaItem[], sort: MediaSort): DesktopMediaItem[] {
  const sorted = [...items];
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => b.sortDate - a.sortDate);
    case 'oldest':
      // Undated items have sortDate 0, which would otherwise monopolize the
      // top of an "oldest first" list — push them to the end instead.
      return sorted.sort((a, b) => (a.sortDate || Infinity) - (b.sortDate || Infinity));
    case 'rating':
      return sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || b.sortDate - a.sortDate);
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'plays':
      return sorted.sort((a, b) => (b.playcount ?? 0) - (a.playcount ?? 0));
  }
}

export function stars(rating: number): string {
  const full = Math.floor(rating);
  return '★'.repeat(full) + (rating - full >= 0.5 ? '½' : '');
}

export default function MediaListApp({ items, kind, indexHref }: Props) {
  const [sort, setSort] = useState<MediaSort>(kind === 'album' ? 'plays' : 'newest');
  const [query, setQuery] = useState('');
  const [onlyRated, setOnlyRated] = useState(false);
  const openDocument = useOpenDocument();

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = items;
    if (needle) {
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(needle) || (item.subtitle ?? '').toLowerCase().includes(needle)
      );
    }
    if (onlyRated) list = list.filter((item) => item.rating != null);
    return sortItems(list, sort);
  }, [items, sort, query, onlyRated]);

  if (items.length === 0) {
    return <p className="app-empty">Nothing here yet — the feed came back empty.</p>;
  }

  return (
    <div className="media-app">
      <div className="media-toolbar">
        <input
          type="search"
          className="media-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={kind === 'album' ? 'Search albums…' : kind === 'book' ? 'Search books…' : 'Search films…'}
          aria-label="Search"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as MediaSort)} aria-label="Sort by">
          {SORTS_FOR[kind].map((id) => (
            <option key={id} value={id}>
              {SORT_LABELS[id]}
            </option>
          ))}
        </select>
        {kind !== 'album' && (
          <label className="media-filter">
            <input type="checkbox" checked={onlyRated} onChange={(e) => setOnlyRated(e.target.checked)} />
            <span>Rated only</span>
          </label>
        )}
      </div>

      <p className="media-count">
        {visible.length} of {items.length}
      </p>

      <ul className="media-grid">
        {visible.map((item) => {
          const inner = (
            <>
              <span className="media-cover">
                {item.coverUrl ? (
                  <img src={item.coverUrl} alt="" loading="lazy" />
                ) : (
                  <span className="media-cover-fallback">{item.title}</span>
                )}
                {item.hasNote && <span className="media-note-flag" title="Has a written note">✎</span>}
              </span>
              <span className="media-title">{item.title}</span>
              {item.subtitle && <span className="media-subtitle">{item.subtitle}</span>}
              <span className="media-meta">
                {item.rating != null && <span className="media-stars">{stars(item.rating)}</span>}
                {item.playcount != null && <span>{item.playcount.toLocaleString()} plays</span>}
                {item.rating == null && item.playcount == null && item.dateLabel && <span>{item.dateLabel}</span>}
              </span>
            </>
          );

          // Items without their own page (an unrated book, an album with no
          // note) link straight out to the source rather than to a dead end.
          return (
            <li key={item.slug} className={`${kind} ${item.href ? '' : 'no-page'}`}>
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
      </ul>

      <a className="media-index-link" href={indexHref}>
        Open the full page &rarr;
      </a>
    </div>
  );
}
