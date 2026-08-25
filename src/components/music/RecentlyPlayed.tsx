import { useEffect, useState } from 'react';
import { lfm, timeAgo, artistNameOf, LASTFM_USER } from './lastfmClient';
import Cover from './Cover';
import type { ModalTarget } from './InfoModal';

interface Row {
  title: string;
  artist: string;
  images: any[];
  isPlaying: boolean;
  timeLabel: string;
}

interface Props {
  onOpen: (target: ModalTarget) => void;
}

export default function RecentlyPlayed({ onOpen }: Props) {
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const data = await lfm({ method: 'user.getrecenttracks', user: LASTFM_USER, limit: 25 });
        const tracksRaw = data.recenttracks?.track;
        const arr = tracksRaw ? (Array.isArray(tracksRaw) ? tracksRaw : [tracksRaw]) : [];
        if (cancelled) return;
        setRows(
          arr.map((t: any) => {
            const artistName = artistNameOf(t.artist);
            const isPlaying = t['@attr']?.nowplaying === 'true';
            return {
              title: t.name,
              artist: artistName,
              images: t.image,
              isPlaying,
              timeLabel: isPlaying ? '● now' : t.date?.uts ? timeAgo(Number(t.date.uts)) : '',
            };
          })
        );
        setStatus('ready');
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
  }, []);

  if (status === 'loading') {
    return (
      <div className="state-block">
        <h3>Spinning up…</h3>
        <p>Pulling your recent scrobbles.</p>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="state-block">
        <h3>Scratch.</h3>
        <p>{error}</p>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="state-block">
        <h3>Nothing here yet</h3>
        <p>No scrobbles found.</p>
      </div>
    );
  }

  return (
    <div className="recent-list">
      {rows.map((row, i) => (
        <div key={i} className="recent-row">
          <Cover images={row.images} label={row.artist} size="medium" />
          <div>
            <button className="title-btn" onClick={() => onOpen({ kind: 'track', artist: row.artist, track: row.title })}>
              {row.title}
            </button>
            <div className="rr-artist">
              <button className="artist-btn" onClick={() => onOpen({ kind: 'artist', artist: row.artist })}>
                {row.artist}
              </button>
            </div>
          </div>
          <div className={`rr-time ${row.isPlaying ? 'live' : ''}`}>{row.timeLabel}</div>
        </div>
      ))}
    </div>
  );
}
