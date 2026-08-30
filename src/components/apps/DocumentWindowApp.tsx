import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useOpenDocument } from '../desktop/openDocument';
import { useWindowStore } from '../desktop/windowStore';

// Shows one of the site's own pages inside a desktop window.
//
// Rather than duplicating every article's markup into the desktop bundle, this
// fetches the real page and lifts its content out. That keeps one canonical
// render per article (the static page, which is what search engines and
// Pagefind see), adds nothing to the desktop's payload, and means a page and
// its window can never drift apart.
//
// The fetch is same-origin against our own build output, and the extracted
// fragment is our own authored Markdown — the same HTML the browser would
// render if you navigated to the page directly.

interface Props {
  url: string;
  /** So the window can retitle itself once the real page arrives. */
  windowId: string;
}

export default function DocumentWindowApp({ url, windowId }: Props) {
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [html, setHtml] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const openDocument = useOpenDocument();
  const setWindowTitle = useWindowStore((st) => st.setWindowTitle);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus('loading');
      try {
        const res = await fetch(url, { headers: { Accept: 'text/html' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (cancelled) return;

        const doc = new DOMParser().parseFromString(text, 'text/html');
        const body = doc.querySelector('.doc-body');
        if (!body) throw new Error('No content found on that page.');

        // "Back to desktop" is meaningless in a window that's already on it.
        body.querySelector('.back-link')?.remove();

        // The clicked link's text is a rough guess (a card's text runs its
        // label, title and summary together) — the page's own <h1> is the
        // real title.
        const heading = body.querySelector('.doc-title')?.textContent?.trim();
        if (heading) setWindowTitle(windowId, heading);

        setHtml(body.innerHTML);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [url, windowId, setWindowTitle]);

  // Scroll back to the top when the window is pointed at a different page.
  useEffect(() => {
    containerRef.current?.scrollTo?.({ top: 0 });
  }, [html]);

  // This memo is load-bearing, not an optimization. React 19 compares
  // `dangerouslySetInnerHTML` by OBJECT IDENTITY, not by the `__html` string:
  // a fresh `{{ __html: html }}` literal every render makes it re-assign
  // innerHTML and rebuild this whole subtree. Focusing the window on mousedown
  // is a state change, so without a stable object the nodes under the cursor
  // were destroyed between mousedown and mouseup — the browser then never
  // fired a click at all, and every link in here silently did nothing.
  const htmlProp = useMemo(() => ({ __html: html }), [html]);

  /**
   * Links inside the fetched content open as their own windows too, so
   * following "Related → the recommendation" keeps you on the desktop. Anything
   * off-site, or any modified click, is left to the browser.
   */
  function handleClick(e: MouseEvent<HTMLDivElement>) {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    if (anchor.target === '_blank') return;

    const resolved = new URL(href, window.location.href);
    if (resolved.origin !== window.location.origin) return;

    // An image or file link should just open normally.
    if (/\.(png|jpe?g|gif|webp|avif|svg|pdf)$/i.test(resolved.pathname)) return;

    const title = anchor.textContent?.trim().slice(0, 60) || 'Document';
    openDocument(resolved.pathname + resolved.search, title, e);
  }

  if (status === 'loading') {
    return (
      <div className="state-block">
        <h3>Opening…</h3>
        <p>Fetching the page.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="state-block">
        <h3>Couldn't open that in a window.</h3>
        <p>
          <a href={url}>Open it as a normal page instead &rarr;</a>
        </p>
      </div>
    );
  }

  return (
    <div className="doc-window" ref={containerRef} onClick={handleClick}>
      <div dangerouslySetInnerHTML={htmlProp} />
      <p className="doc-window-permalink">
        <a href={url}>Open this as its own page &rarr;</a>
      </p>
    </div>
  );
}
