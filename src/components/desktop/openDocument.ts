import type { MouseEvent } from 'react';
import { useWindowStore } from './windowStore';

// Opening an article/film/book/recommendation inside the desktop instead of
// navigating away from it.
//
// The links stay real `<a href>` elements on purpose: cmd/ctrl/middle-click
// still opens a normal tab, the URLs are still crawlable and shareable, and
// with JavaScript off the site behaves exactly as it did before. This only
// intercepts a plain left-click.

/** True for clicks the browser should keep handling itself. */
function isModifiedClick(e: MouseEvent): boolean {
  return e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

export function useOpenDocument() {
  const openWindow = useWindowStore((s) => s.openWindow);

  /**
   * Opens `href` as a document window. The URL doubles as the window's appId,
   * so clicking the same item twice focuses the window that's already open
   * rather than stacking duplicates.
   */
  return function openDocument(href: string, title: string, e?: MouseEvent) {
    if (e) {
      if (isModifiedClick(e)) return;
      e.preventDefault();
    }
    openWindow({ appId: `doc:${href}`, title, width: 620, height: 560, docUrl: href });
  };
}
