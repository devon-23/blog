import { useEffect, useState } from 'react';
import { lfm, bestImage, colorFor, initial, trimSummary, LASTFM_USER } from './lastfmClient';
import { getWikipediaArtistImage } from './wikipedia';

export type ModalTarget =
  | { kind: 'artist'; artist: string }
  | { kind: 'album'; artist: string; album: string }
  | { kind: 'track'; artist: string; track: string };

interface Props {
  target: ModalTarget;
  onClose: () => void;
  onNavigate: (target: ModalTarget) => void;
}

export default function InfoModal({ target, onClose, onNavigate }: Props) {
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState('');
  const [body, setBody] = useState<React.ReactNode>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    async function run() {
      try {
        if (target.kind === 'artist') {
          const data = await lfm({ method: 'artist.getinfo', artist: target.artist, autocorrect: 1 });
          if (cancelled) return;
          const a = data.artist;
          const wikiImg = await getWikipediaArtistImage(a.name).catch(() => null);
          if (cancelled) return;
          const img = wikiImg || bestImage(a.image, 'extralarge');
          const bio = trimSummary(a.bio?.summary);
          const listeners = a.stats ? Number(a.stats.listeners || 0).toLocaleString() : '—';
          const playcount = a.stats ? Number(a.stats.playcount || 0).toLocaleString() : '—';
          const tags = a.tags?.tag ? (Array.isArray(a.tags.tag) ? a.tags.tag : [a.tags.tag]) : [];

          setBody(
            <>
              <div className="modal-hero">
                {img ? (
                  <img src={img} alt="" />
                ) : (
                  <div className="cover-fallback" style={{ background: colorFor(a.name) }}>
                    {initial(a.name)}
                  </div>
                )}
                <div>
                  <div className="eyebrow">Artist</div>
                  <h2>{a.name}</h2>
                  <div className="sub">{tags.slice(0, 4).map((t: any) => t.name).join(' · ')}</div>
                </div>
              </div>
              <div className="modal-body">
                <div className="modal-stat-row">
                  <div className="modal-stat">
                    <div className="num">{listeners}</div>
                    <div className="lbl">listeners</div>
                  </div>
                  <div className="modal-stat">
                    <div className="num">{playcount}</div>
                    <div className="lbl">scrobbles</div>
                  </div>
                </div>
                <p className="bio">{bio || 'No biography available for this artist yet.'}</p>
              </div>
            </>
          );
        } else if (target.kind === 'album') {
          const data = await lfm({ method: 'album.getinfo', artist: target.artist, album: target.album, autocorrect: 1 });
          if (cancelled) return;
          const a = data.album;
          const img = bestImage(a.image, 'extralarge');
          const bio = trimSummary(a.wiki?.summary);
          const tracksRaw = a.tracks?.track;
          const tracks = tracksRaw ? (Array.isArray(tracksRaw) ? tracksRaw : [tracksRaw]) : [];

          setBody(
            <>
              <div className="modal-hero">
                {img ? (
                  <img src={img} alt="" />
                ) : (
                  <div className="cover-fallback" style={{ background: colorFor(a.name) }}>
                    {initial(a.name)}
                  </div>
                )}
                <div>
                  <div className="eyebrow">Album</div>
                  <h2>{a.name}</h2>
                  <div className="sub">
                    <button className="linklike" onClick={() => onNavigate({ kind: 'artist', artist: a.artist })}>
                      {a.artist}
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-body">
                {a.playcount && (
                  <div className="modal-stat-row">
                    <div className="modal-stat">
                      <div className="num">{Number(a.playcount).toLocaleString()}</div>
                      <div className="lbl">scrobbles</div>
                    </div>
                  </div>
                )}
                {tracks.length > 0 && (
                  <table className="tracklist">
                    <tbody>
                      {tracks.map((t: any, i: number) => {
                        const dur = Number(t.duration || 0);
                        const mm = Math.floor(dur / 60);
                        const ss = String(dur % 60).padStart(2, '0');
                        return (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{t.name}</td>
                            <td>{dur ? `${mm}:${ss}` : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                {bio && <p className="bio" style={{ marginTop: 14 }}>{bio}</p>}
              </div>
            </>
          );
        } else {
          const data = await lfm({ method: 'track.getInfo', artist: target.artist, track: target.track, username: LASTFM_USER, autocorrect: 1 });
          if (cancelled) return;
          const t = data.track;
          const album = t.album;
          const img = album ? bestImage(album.image, 'extralarge') : null;
          const bio = trimSummary(t.wiki?.summary);

          setBody(
            <>
              <div className="modal-hero">
                {img ? (
                  <img src={img} alt="" />
                ) : (
                  <div className="cover-fallback" style={{ background: colorFor(t.name) }}>
                    {initial(t.name)}
                  </div>
                )}
                <div>
                  <div className="eyebrow">Track</div>
                  <h2>{t.name}</h2>
                  <div className="sub">
                    <button className="linklike" onClick={() => onNavigate({ kind: 'artist', artist: t.artist?.name })}>
                      {t.artist?.name}
                    </button>
                    {album ? ` · ${album.title}` : ''}
                  </div>
                </div>
              </div>
              <div className="modal-body">
                <div className="modal-stat-row">
                  <div className="modal-stat">
                    <div className="num">{t.userplaycount != null ? Number(t.userplaycount).toLocaleString() : '—'}</div>
                    <div className="lbl">{LASTFM_USER}'s plays</div>
                  </div>
                  <div className="modal-stat">
                    <div className="num">{t.listeners ? Number(t.listeners).toLocaleString() : '—'}</div>
                    <div className="lbl">listeners</div>
                  </div>
                </div>
                {bio ? <p className="bio">{bio}</p> : <p className="scratch-note">No write-up for this track yet.</p>}
              </div>
            </>
          );
        }
        if (!cancelled) setStatus('ready');
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Something went wrong.');
          setStatus('error');
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [target.kind, target.artist, (target as any).album, (target as any).track]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sleeve window" onClick={(e) => e.stopPropagation()}>
        <div className="title-bar">
          <div className="title-bar-text">
            {target.kind === 'artist' ? target.artist : target.kind === 'album' ? target.album : target.track}
          </div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose} />
          </div>
        </div>
        <div className="window-body modal-inner">
          {status === 'loading' && (
            <div className="state-block">
              <h3>Spinning up…</h3>
              <p>Pulling data from Last.fm.</p>
            </div>
          )}
          {status === 'error' && (
            <div className="state-block">
              <h3>Scratch.</h3>
              <p>{error}</p>
            </div>
          )}
          {status === 'ready' && body}
        </div>
      </div>
    </div>
  );
}
