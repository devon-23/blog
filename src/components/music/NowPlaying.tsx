import { useEffect, useState } from 'react';
import { lfm, bestImage, colorFor, initial, timeAgo, artistNameOf, LASTFM_USER } from './lastfmClient';
import type { ModalTarget } from './InfoModal';

interface WeeklyItem {
  name: string;
  sub: string | null;
  onClick: () => void;
}

interface OverviewData {
  displayName: string;
  avatarUrl: string | null;
  playcount: string;
  country: string | null;
  npTitle: string;
  npArtist: string;
  npCover: string | null;
  isPlaying: boolean;
  statusText: string;
  weeklyAlbums: WeeklyItem[];
  weeklyArtists: WeeklyItem[];
  weeklyTracks: WeeklyItem[];
}

interface Props {
  onOpen: (target: ModalTarget) => void;
}

export default function NowPlaying({ onOpen }: Props) {
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState('');
  const [data, setData] = useState<OverviewData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const [userData, recent] = await Promise.all([
          lfm({ method: 'user.getinfo', user: LASTFM_USER }),
          lfm({ method: 'user.getrecenttracks', user: LASTFM_USER, limit: 1 }),
        ]);

        const u = userData.user;
        const displayName = u.realname?.trim() ? u.realname : u.name;
        const avatarUrl = bestImage(u.image, 'large');
        const playcount = Number(u.playcount || 0).toLocaleString();
        const country = u.country && u.country !== 'None' ? u.country : null;

        const tracksRaw = recent.recenttracks?.track;
        const track = Array.isArray(tracksRaw) ? tracksRaw[0] : tracksRaw;

        let npTitle = 'Quiet sleeve';
        let npArtist = 'No scrobbles yet.';
        let npCover: string | null = null;
        let isPlaying = false;
        let statusText = 'silence';

        if (track) {
          isPlaying = track['@attr']?.nowplaying === 'true';
          const artistName = artistNameOf(track.artist);
          npTitle = track.name || 'Untitled';
          npArtist = artistName;
          npCover = bestImage(track.image);
          if (isPlaying) {
            statusText = 'playing now';
          } else {
            const uts = track.date?.uts ? Number(track.date.uts) : null;
            statusText = uts ? 'last spun ' + timeAgo(uts) : 'not currently playing';
          }
        }

        const [wAlb, wArt, wTrk] = await Promise.all([
          lfm({ method: 'user.getweeklyalbumchart', user: LASTFM_USER, limit: 5 }),
          lfm({ method: 'user.getweeklyartistchart', user: LASTFM_USER, limit: 5 }),
          lfm({ method: 'user.getweeklytrackchart', user: LASTFM_USER, limit: 5 }),
        ]);

        const toArr = (x: any) => (x ? (Array.isArray(x) ? x : [x]) : []);

        const weeklyAlbums: WeeklyItem[] = toArr(wAlb.weeklyalbumchart?.album)
          .slice(0, 5)
          .map((item: any) => ({
            name: item.name,
            sub: artistNameOf(item.artist),
            onClick: () => onOpen({ kind: 'album', artist: artistNameOf(item.artist), album: item.name }),
          }));

        const weeklyArtists: WeeklyItem[] = toArr(wArt.weeklyartistchart?.artist)
          .slice(0, 5)
          .map((item: any) => ({
            name: item.name,
            sub: null,
            onClick: () => onOpen({ kind: 'artist', artist: item.name }),
          }));

        const weeklyTracks: WeeklyItem[] = toArr(wTrk.weeklytrackchart?.track)
          .slice(0, 5)
          .map((item: any) => ({
            name: item.name,
            sub: artistNameOf(item.artist),
            onClick: () => onOpen({ kind: 'track', artist: artistNameOf(item.artist), track: item.name }),
          }));

        if (cancelled) return;
        setData({
          displayName,
          avatarUrl,
          playcount,
          country,
          npTitle,
          npArtist,
          npCover,
          isPlaying,
          statusText,
          weeklyAlbums,
          weeklyArtists,
          weeklyTracks,
        });
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
  }, [onOpen]);

  if (status === 'loading') {
    return (
      <div className="state-block">
        <h3>Spinning up…</h3>
        <p>Pulling data from Last.fm.</p>
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
  if (!data) return null;

  return (
    <div className="overview-grid">
      <div className="card player-card">
        <div className="eyebrow">On the turntable</div>
        <div className="turntable">
          <div className="platter" />
          <div className={`tonearm ${data.isPlaying ? 'down' : ''}`}>
            <svg viewBox="0 0 90 110" width="60" height="74">
              <circle cx="78" cy="18" r="9" fill="#1c150f" />
              <rect x="20" y="14" width="58" height="5" rx="2.5" fill="#3a2c1d" />
              <circle cx="18" cy="16" r="7" fill="#bf5230" />
            </svg>
          </div>
          <div className={`vinyl ${data.isPlaying ? 'spinning' : ''}`}>
            <div className="spindle" />
            {data.npCover ? (
              <img src={data.npCover} alt="" />
            ) : (
              <div className="label-fallback" style={{ background: colorFor(data.npArtist) }}>
                {initial(data.npArtist)}
              </div>
            )}
          </div>
        </div>
        <div className="np-info">
          <div className="np-title">{data.npTitle}</div>
          <div className="np-artist">{data.npArtist}</div>
        </div>
        <div className={`np-status ${data.isPlaying ? '' : 'idle'}`}>
          <span className="dot" /> {data.statusText}
        </div>
        <div className="user-strip">
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt="" />
          ) : (
            <div className="fallback-avatar" style={{ background: colorFor(LASTFM_USER) }}>
              {initial(data.displayName)}
            </div>
          )}
          <div>
            <div className="ust-name">{data.displayName}</div>
            <div className="ust-meta">
              {data.playcount} scrobbles{data.country ? ` · ${data.country}` : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="card weekly-card">
        <h3>This week, in three stacks</h3>
        <div className="weekly-cols">
          <WeeklyColumn title="Top Albums" items={data.weeklyAlbums} />
          <WeeklyColumn title="Top Artists" items={data.weeklyArtists} />
          <WeeklyColumn title="Top Tracks" items={data.weeklyTracks} />
        </div>
      </div>
    </div>
  );
}

function WeeklyColumn({ title, items }: { title: string; items: WeeklyItem[] }) {
  return (
    <div className="weekly-col">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p className="app-empty small">Nothing charted this week.</p>
      ) : (
        <ul className="weekly-list">
          {items.map((item, i) => (
            <li key={i}>
              <span className="rank">{i + 1}</span>
              <button className="linklike" onClick={item.onClick}>
                {item.name}
                {item.sub && (
                  <>
                    <br />
                    <span className="weekly-sub">{item.sub}</span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
