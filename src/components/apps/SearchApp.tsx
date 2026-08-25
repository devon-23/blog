import { useEffect, useRef, useState } from 'react';
import { withBase } from '../../lib/url';

interface PagefindResultData {
  url: string;
  excerpt: string;
  meta?: { title?: string };
}

interface PagefindModule {
  options: (opts: Record<string, unknown>) => Promise<void>;
  search: (query: string) => Promise<{ results: { data: () => Promise<PagefindResultData> }[] }>;
}

export default function SearchApp() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const pagefindRef = useRef<PagefindModule | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PagefindResultData[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const url = withBase('/pagefind/pagefind.js');
        const mod = (await import(/* @vite-ignore */ url)) as PagefindModule;
        await mod.options({ bundlePath: withBase('/pagefind/') });
        if (cancelled) return;
        pagefindRef.current = mod;
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== 'ready' || !query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const handle = setTimeout(async () => {
      const pagefind = pagefindRef.current;
      if (!pagefind) return;
      const search = await pagefind.search(query);
      const data = await Promise.all(search.results.slice(0, 15).map((r) => r.data()));
      if (!cancelled) {
        setResults(data);
        setSearching(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, status]);

  return (
    <div className="app-search">
      <div className="app-search-bar">
        <input
          type="text"
          placeholder="Search everything on the site…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={status !== 'ready'}
        />
      </div>

      {status === 'unavailable' && (
        <p className="app-empty">
          Search index isn't available here — it's generated at build time. It'll work on the deployed
          site; locally, run <code>npm run build</code> once first.
        </p>
      )}
      {status === 'loading' && <p className="app-empty small">Loading search index…</p>}
      {searching && <p className="app-empty small">Searching…</p>}
      {status === 'ready' && query.trim() && !searching && results.length === 0 && (
        <p className="app-empty">No results for "{query}".</p>
      )}

      <ul className="app-list">
        {results.map((r) => (
          <li key={r.url}>
            <a href={r.url}>
              <span className="app-list-title">{r.meta?.title || r.url}</span>
              <span className="app-list-summary" dangerouslySetInnerHTML={{ __html: r.excerpt }} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
