import { useEffect, useState } from 'react';

// The odometer every 1999 homepage had at the bottom. There's no server here
// to count real hits, so this counts *your* visits on top of a fixed baseline
// — honest about being a decoration, and it still ticks up when you come back.

const STORAGE_KEY = 'devon98-visits';
const BASELINE = 1247;
const DIGITS = 6;

export default function HitCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let visits = 1;
    try {
      visits = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0) + 1;
      window.localStorage.setItem(STORAGE_KEY, String(visits));
    } catch {
      // No storage — still render something rather than an empty gap.
    }
    setCount(BASELINE + visits);
  }, []);

  // Render nothing until the client count lands, so SSR and hydration agree.
  if (count === null) return null;

  const digits = String(count).padStart(DIGITS, '0').split('');

  return (
    <div className="hit-counter" title={`You are visitor #${count}. (Counted in your browser — see HitCounter.tsx.)`}>
      <span className="hit-counter-label">visitors</span>
      <span className="hit-counter-digits">
        {digits.map((d, i) => (
          <span key={i} className="hit-digit">
            {d}
          </span>
        ))}
      </span>
    </div>
  );
}
