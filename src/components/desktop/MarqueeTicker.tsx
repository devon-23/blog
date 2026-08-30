import { useMemo } from 'react';
import { useNowPlaying } from '../music/useNowPlaying';
import type { DesktopData } from './types';
import { PROFILE } from '../../data/profiles';

// The scrolling banner across the top of the desktop. Content is assembled
// from whatever the site actually knows right now — newest post, last film,
// current book, current track — so it's a live status line rather than a
// decoration that says the same thing forever.
//
// CSS animation (not <marquee>, which is deprecated and unstyleable) and it
// pauses on hover, plus respects prefers-reduced-motion in the stylesheet.

interface Props {
  data: DesktopData;
}

export default function MarqueeTicker({ data }: Props) {
  const np = useNowPlaying();

  const items = useMemo(() => {
    const parts: string[] = [`✧ welcome to ${PROFILE.displayName}'s desktop ✧`];

    const newest = data.posts[0];
    if (newest) parts.push(`NEW: "${newest.title}"`);

    const film = data.mediaDiet.films[0];
    if (film) parts.push(`last watched: ${film.title}${film.subtitle ? ` (${film.subtitle})` : ''}`);

    const book = data.mediaDiet.readingNow[0] ?? data.mediaDiet.finishedBooks[0];
    if (book) parts.push(`${data.mediaDiet.readingNow[0] ? 'reading' : 'just read'}: ${book.title}`);

    const rec = data.recommendations[0];
    if (rec) parts.push(`recommending: ${rec.title}`);

    parts.push('right-click the desktop to change the wallpaper');
    parts.push('sign the guestbook !!');
    return parts;
  }, [data]);

  // The live track goes first when something is actually playing.
  const line = (np.isPlaying ? [`♪ NOW PLAYING: ${np.title} — ${np.artist} ♪`, ...items] : items).join('   ✦   ');

  return (
    <div className={`marquee-ticker ${np.isPlaying ? 'live' : ''}`} aria-hidden="true">
      <div className="marquee-track">
        {/* Duplicated so the loop is seamless — the second copy slides in as the first leaves. */}
        <span>{line}   ✦   </span>
        <span>{line}   ✦   </span>
      </div>
    </div>
  );
}
