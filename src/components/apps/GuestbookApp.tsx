import { useEffect, useState, type FormEvent } from 'react';

// A 2003 guestbook with a 2026 caveat: the site is static, so there's no
// server to post to. Entries live in the visitor's own localStorage — they see
// their signature persist across visits, but nobody else does, and nothing
// leaves the browser. That's stated plainly in the UI rather than pretending.
//
// To make this a real shared guestbook you'd need a backend; see the note in
// README under "Guestbook".

const STORAGE_KEY = 'devon98-guestbook';
const MAX_ENTRIES = 50;

interface Entry {
  name: string;
  message: string;
  /** ISO string; formatted for display on read. */
  at: string;
  mood: string;
}

const MOODS = ['(◕‿◕)', '(ﾉ◕ヮ◕)ﾉ', '(¬‿¬)', '(⌐■_■)', '(=^･ω･^=)', '♥', '★', '☾'];

const SEED: Entry[] = [
  {
    name: 'devon',
    message: 'first post on my own guestbook, as tradition demands. leave a note!',
    at: '2026-08-24T12:00:00.000Z',
    mood: '★',
  },
];

export default function GuestbookApp() {
  const [entries, setEntries] = useState<Entry[]>(SEED);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [mood, setMood] = useState(MOODS[0]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setEntries([...parsed, ...SEED]);
      }
    } catch {
      // Corrupt or unavailable storage — just show the seed entry.
    }
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedMessage) return;

    const entry: Entry = { name: trimmedName, message: trimmedMessage, at: new Date().toISOString(), mood };
    const mine = [entry, ...entries.filter((x) => !SEED.includes(x))].slice(0, MAX_ENTRIES);

    setEntries([...mine, ...SEED]);
    setName('');
    setMessage('');
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mine));
    } catch {
      // Signing still works for this session even if we can't persist it.
    }
  }

  return (
    <div className="guestbook-app">
      <div className="guestbook-header">
        <span className="glitter-text">sign my guestbook</span>
        <span className="guestbook-note">
          Saved in your browser only — this site is static, so your note stays on your machine.
        </span>
      </div>

      <form className="guestbook-form" onSubmit={submit}>
        <div className="field-row">
          <label htmlFor="gb-name">Name</label>
          <input id="gb-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="xXcoolvisitorXx" />
        </div>
        <div className="field-row guestbook-moods">
          <label>Mood</label>
          <div className="mood-picker">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m}
                className={`mood-btn ${mood === m ? 'selected' : ''}`}
                onClick={() => setMood(m)}
                aria-pressed={mood === m}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={400}
          rows={3}
          placeholder="say something nice, or don't"
        />
        <button type="submit" className="guestbook-submit" disabled={!name.trim() || !message.trim()}>
          ✎ Sign it
        </button>
      </form>

      <hr className="glitter-rule" />

      <ul className="guestbook-entries">
        {entries.map((entry, i) => (
          <li key={`${entry.at}-${i}`}>
            <div className="gb-entry-head">
              <span className="gb-mood">{entry.mood}</span>
              <b>{entry.name}</b>
              <span className="gb-date">{formatWhen(entry.at)}</span>
            </div>
            <p>{entry.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
