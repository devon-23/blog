import { useNowPlaying } from '../music/useNowPlaying';
import { colorFor, initial } from '../music/lastfmClient';
import { PROFILES } from '../../data/profiles';
import type { DesktopMediaDiet } from '../desktop/types';
import type { DietItem } from '../../lib/mediaDiet';

// "What Devon is actually consuming right now" — one window pulling three
// accounts together. Music is live from the browser (Last.fm); films and books
// are baked in at build time from Letterboxd/Goodreads RSS, so they refresh
// whenever the site rebuilds rather than on every page load.

interface Props {
  diet: DesktopMediaDiet;
}

export default function CurrentlyApp({ diet }: Props) {
  const np = useNowPlaying();
  const lastFilm = diet.films[0];
  const lastBook = diet.finishedBooks[0];
  const reading = diet.readingNow[0];

  return (
    <div className="currently-app">
      <div className="currently-header">
        <span className="glitter-text">currently</span>
        <span className="currently-sub">the three feeds that actually know me</span>
      </div>

      <div className="currently-cards">
        {/* ---- Music: live ---- */}
        <section className={`currently-card music ${np.isPlaying ? 'live' : ''}`}>
          <h3>
            <span className="currently-icon">♪</span> Listening
            {np.isPlaying && <span className="live-tag">LIVE</span>}
          </h3>
          {np.status === 'loading' ? (
            <p className="app-empty small">Asking Last.fm…</p>
          ) : np.status === 'error' ? (
            <p className="app-empty small">Last.fm isn't answering right now.</p>
          ) : (
            <a className="currently-body" href={np.trackUrl} target="_blank" rel="noopener noreferrer">
              <div className={`currently-art square ${np.isPlaying ? 'pulsing' : ''}`}>
                {np.coverUrl ? (
                  <img src={np.coverUrl} alt="" />
                ) : (
                  <span className="currently-art-fallback" style={{ background: colorFor(np.artist) }}>
                    {initial(np.artist)}
                  </span>
                )}
              </div>
              <div className="currently-text">
                <b>{np.title}</b>
                <span>{np.artist}</span>
                {np.album && <span className="dim">{np.album}</span>}
                <span className="currently-meta">{np.statusText}</span>
              </div>
            </a>
          )}
          <a className="currently-source" href={PROFILES.lastfm.url} target="_blank" rel="noopener noreferrer">
            last.fm/{PROFILES.lastfm.user} →
          </a>
        </section>

        {/* ---- Film ---- */}
        <section className="currently-card film">
          <h3>
            <span className="currently-icon">▶</span> Last watched
          </h3>
          {lastFilm ? <DietBody item={lastFilm} /> : <p className="app-empty small">No films logged yet.</p>}
          <a className="currently-source" href={PROFILES.letterboxd.url} target="_blank" rel="noopener noreferrer">
            letterboxd/{PROFILES.letterboxd.user} →
          </a>
        </section>

        {/* ---- Books ---- */}
        <section className="currently-card book">
          <h3>
            <span className="currently-icon">▤</span> {reading ? 'Reading now' : 'Last read'}
          </h3>
          {reading ? (
            <DietBody item={reading} note="in progress" />
          ) : lastBook ? (
            <DietBody item={lastBook} note={lastBook.dateLabel ? `finished ${lastBook.dateLabel}` : undefined} />
          ) : (
            <p className="app-empty small">No books logged yet.</p>
          )}
          {reading && lastBook && (
            <p className="currently-footnote">
              Last finished: <b>{lastBook.title}</b>
              {lastBook.rating ? ` — ${stars(lastBook.rating)}` : ''}
            </p>
          )}
          <a className="currently-source" href={PROFILES.goodreads.url} target="_blank" rel="noopener noreferrer">
            goodreads →
          </a>
        </section>
      </div>

      {diet.films.length > 1 && (
        <>
          <hr className="glitter-rule" />
          <h4 className="currently-strip-title">Recently watched</h4>
          <ul className="currently-strip">
            {diet.films.slice(0, 8).map((film) => (
              <li key={film.externalUrl}>
                <a
                  href={film.href ?? film.externalUrl}
                  {...(film.href ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                  title={`${film.title}${film.subtitle ? ` (${film.subtitle})` : ''}`}
                >
                  {film.coverUrl ? <img src={film.coverUrl} alt={film.title} loading="lazy" /> : <span className="poster-fallback">{film.title}</span>}
                  {film.rating != null && <span className="currently-strip-rating">{stars(film.rating)}</span>}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      {diet.finishedBooks.length > 0 && (
        <>
          <hr className="glitter-rule" />
          <h4 className="currently-strip-title">Recently read</h4>
          <ul className="currently-strip books">
            {diet.finishedBooks.slice(0, 8).map((book) => (
              <li key={book.externalUrl}>
                <a
                  href={book.href ?? book.externalUrl}
                  {...(book.href ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                  title={`${book.title} — ${book.subtitle ?? ''}`}
                >
                  {book.coverUrl ? <img src={book.coverUrl} alt={book.title} loading="lazy" /> : <span className="poster-fallback">{book.title}</span>}
                  {book.rating != null && <span className="currently-strip-rating">{stars(book.rating)}</span>}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * One film/book row. Links to this item's own page on the site when it has one
 * (so a click lands on the review plus anything added since), and falls through
 * to Letterboxd/Goodreads only when it doesn't.
 */
function DietBody({ item, note }: { item: DietItem; note?: string }) {
  const internal = Boolean(item.href);
  return (
    <a
      className="currently-body"
      href={item.href ?? item.externalUrl}
      {...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
    >
      <div className="currently-art poster">
        {item.coverUrl ? <img src={item.coverUrl} alt="" /> : <span className="currently-art-fallback">?</span>}
      </div>
      <div className="currently-text">
        <b>{item.title}</b>
        {item.subtitle && <span className="dim">{item.subtitle}</span>}
        {item.rating != null && <span className="rating-stars">{stars(item.rating)}</span>}
        <span className="currently-meta">
          {[note ?? item.dateLabel, item.meta].filter(Boolean).join(' · ')}
        </span>
        {item.review && <span className="currently-review">“{trim(item.review, 150)}”</span>}
      </div>
    </a>
  );
}

/** Letterboxd rates in half stars; Goodreads in whole ones. Both land here. */
function stars(rating: number): string {
  const full = Math.floor(rating);
  return '★'.repeat(full) + (rating - full >= 0.5 ? '½' : '');
}

function trim(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : flat.slice(0, flat.lastIndexOf(' ', max)).trimEnd() + '…';
}
