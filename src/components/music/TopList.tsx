import { useEffect, useState } from 'react';
import { lfm, LASTFM_USER } from './lastfmClient';
import Cover from './Cover';
import type { ModalTarget } from './InfoModal';

type Method = 'user.gettopalbums' | 'user.gettoptracks' | 'user.gettopartists';

interface Item {
  name: string;
  artist: string | null;
  playcount: number;
  images: any[];
  sub: string;
}

interface Props {
  method: Method;
  variant: 'grid' | 'rank';
  onOpen: (target: ModalTarget) => void;
}

const PERIODS = [
  { value: 'overall', label: 'overall' },
  { value: '12month', label: 'last 12 months' },
  { value: '6month', label: 'last 6 months' },
  { value: '3month', label: 'last 3 months' },
  { value: '1month', label: 'last month' },
  { value: '7day', label: 'last 7 days' },
];

function extract(method: Method, data: any): Item[] {
  const toArr = (x: any) => (x ? (Array.isArray(x) ? x : [x]) : []);
  if (method === 'user.gettopalbums') {
    return toArr(data.topalbums?.album).map((a: any) => ({
      name: a.name,
      artist: a.artist?.name || a.artist?.['#text'] || 'Unknown artist',
      playcount: Number(a.playcount || 0),
      images: a.image,
      sub: '',
    }));
  }
  if (method === 'user.gettoptracks') {
    return toArr(data.toptracks?.track).map((t: any) => ({
      name: t.name,
      artist: t.artist?.name || t.artist?.['#text'] || 'Unknown artist',
      playcount: Number(t.playcount || 0),
      images: t.image,
      sub: t.artist?.name || t.artist?.['#text'] || 'Unknown artist',
    }));
  }
  return toArr(data.topartists?.artist).map((a: any) => ({
    name: a.name,
    artist: null,
    playcount: Number(a.playcount || 0),
    images: a.image,
    sub: a.tagcount ? `${a.tagcount} tags` : 'artist',
  }));
}

export default function TopList({ method, variant, onOpen }: Props) {
  const [period, setPeriod] = useState('overall');
  const [limit, setLimit] = useState(24);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState('');
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    async function run() {
      try {
        const data = await lfm({
          method,
          user: LASTFM_USER,
          period,
          limit: method === 'user.gettopalbums' ? limit : 25,
        });
        if (cancelled) return;
        setItems(extract(method, data));
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
  }, [method, period, limit]);

  const openItem = (item: Item) => {
    if (method === 'user.gettopalbums') onOpen({ kind: 'album', artist: item.artist!, album: item.name });
    else if (method === 'user.gettoptracks') onOpen({ kind: 'track', artist: item.artist!, track: item.name });
    else onOpen({ kind: 'artist', artist: item.name });
  };

  const maxPlays = Math.max(...items.map((i) => i.playcount), 1);

  return (
    <div>
      <div className="control-row">
        <select className="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        {method === 'user.gettopalbums' && (
          <select className="period" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            {[12, 24, 36, 50].map((n) => (
              <option key={n} value={n}>
                show {n}
              </option>
            ))}
          </select>
        )}
      </div>

      {status === 'loading' && (
        <div className="state-block">
          <h3>Spinning up…</h3>
          <p>Pulling the list.</p>
        </div>
      )}
      {status === 'error' && (
        <div className="state-block">
          <h3>Scratch.</h3>
          <p>{error}</p>
        </div>
      )}
      {status === 'ready' && items.length === 0 && (
        <div className="state-block">
          <h3>Nothing here yet</h3>
          <p>No results for this range.</p>
        </div>
      )}

      {status === 'ready' && items.length > 0 && variant === 'grid' && (
        <div className="album-grid">
          {items.map((item, i) => (
            <div key={i} className="album-tile">
              <Cover images={item.images} label={item.name} size="extralarge" />
              <div className="tile-overlay">
                <button onClick={() => openItem(item)}>
                  <div className="t-name">{item.name}</div>
                  <div className="t-artist">{item.artist}</div>
                  <div className="t-plays">{item.playcount.toLocaleString()} plays</div>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'ready' && items.length > 0 && variant === 'rank' && (
        <div className="rank-list">
          {items.map((item, i) => (
            <div key={i} className="rank-row">
              <div className="rank-num mono">{i + 1}</div>
              <Cover images={item.images} label={item.name} size="medium" />
              <div className="rr-main">
                <button className="title-btn" onClick={() => openItem(item)}>
                  {item.name}
                </button>
                <div className="rr-sub">{item.sub}</div>
              </div>
              <div className="bar-wrap">
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.round((item.playcount / maxPlays) * 100)}%` }} />
                </div>
              </div>
              <div className="plays mono">{item.playcount.toLocaleString()} plays</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
