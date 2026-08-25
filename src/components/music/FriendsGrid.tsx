import { useEffect, useState } from 'react';
import { lfm, LASTFM_USER } from './lastfmClient';
import Cover from './Cover';

interface Friend {
  name: string;
  images: any[];
}

export default function FriendsGrid() {
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const data = await lfm({ method: 'user.getfriends', user: LASTFM_USER, limit: 50 });
        const raw = data.friends?.user;
        const arr = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
        if (cancelled) return;
        setFriends(arr.map((f: any) => ({ name: f.name, images: f.image })));
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
        <p>Looking through the address book.</p>
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
  if (friends.length === 0) {
    return (
      <div className="state-block">
        <h3>Nothing here yet</h3>
        <p>No friends listed.</p>
      </div>
    );
  }

  return (
    <div className="friend-grid">
      {friends.map((f) => (
        <a key={f.name} className="friend-card" href={`https://www.last.fm/user/${f.name}`} target="_blank" rel="noopener noreferrer">
          <Cover images={f.images} label={f.name} size="medium" />
          <div className="f-name">{f.name}</div>
        </a>
      ))}
    </div>
  );
}
