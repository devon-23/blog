import { useState } from 'react';
import { useNowPlaying } from '../music/useNowPlaying';
import { colorFor, initial } from '../music/lastfmClient';
import { PROFILES } from '../../data/profiles';

// The always-on desktop gadget — a port of github.com/devon-23/nowPlaying's
// player into Win98 chrome. It sits above the taskbar and quietly reports the
// last scrobble; when something is actually playing it lights up, the cover
// spins, and the progress bar runs.

interface Props {
  onClose: () => void;
}

export default function NowPlayingGadget({ onClose }: Props) {
  const np = useNowPlaying();
  const [collapsed, setCollapsed] = useState(false);

  if (np.status === 'error') return null; // never let a dead API leave a broken box on the desktop

  const live = np.isPlaying;

  return (
    <div className={`np-gadget ${live ? 'live' : ''} ${collapsed ? 'collapsed' : ''}`}>
      <div className="title-bar np-gadget-bar">
        <div className="title-bar-text">
          {live ? '♪ Now Playing' : '♪ Last Played'}
          {live && <span className="np-gadget-blink"> ●</span>}
        </div>
        <div className="title-bar-controls">
          <button aria-label={collapsed ? 'Restore' : 'Minimize'} onClick={() => setCollapsed((v) => !v)} />
          <button aria-label="Close" onClick={onClose} />
        </div>
      </div>

      {!collapsed && (
        <div className="window-body np-gadget-body">
          {np.status === 'loading' ? (
            <p className="np-gadget-loading">Tuning in…</p>
          ) : (
            <>
              <div className="np-gadget-main">
                <a
                  className={`np-gadget-art ${live ? 'spinning' : ''}`}
                  href={np.trackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {np.coverUrl ? (
                    <img src={np.coverUrl} alt="" />
                  ) : (
                    <span className="np-gadget-art-fallback" style={{ background: colorFor(np.artist) }}>
                      {initial(np.artist)}
                    </span>
                  )}
                  <span className="np-gadget-spindle" />
                </a>

                <div className="np-gadget-meta">
                  <div className="np-gadget-marquee">
                    <span className={live ? 'scrolling' : ''}>
                      {np.title} — {np.artist}
                      {np.album ? ` — ${np.album}` : ''}
                    </span>
                  </div>
                  <div className="np-gadget-status">
                    <span className={`np-gadget-dot ${live ? 'on' : ''}`} /> {np.statusText}
                  </div>
                  <div className="np-gadget-progress">
                    <div className="np-gadget-progress-fill" style={{ width: `${live ? np.progress : 0}%` }} />
                  </div>
                  <div className="np-gadget-times">
                    <span>{live ? np.elapsedLabel : '—:—'}</span>
                    <span>{live ? np.durationLabel : '—:—'}</span>
                  </div>
                </div>
              </div>

              {np.recent.length > 0 && (
                <details className="np-gadget-recent">
                  <summary>before this…</summary>
                  <ul>
                    {np.recent.map((t, i) => (
                      <li key={i}>
                        <b>{t.title}</b> — {t.artist} <i>{t.when}</i>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <a className="np-gadget-link" href={PROFILES.lastfm.url} target="_blank" rel="noopener noreferrer">
                scrobbling as {PROFILES.lastfm.user} →
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
