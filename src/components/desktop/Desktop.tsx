import { useEffect, useState, type MouseEvent } from 'react';
import { useWindowStore } from './windowStore';
import Win98Window from './Win98Window';
import DesktopIcons from './DesktopIcons';
import Taskbar from './Taskbar';
import NowPlayingGadget from './NowPlayingGadget';
import MarqueeTicker from './MarqueeTicker';
import type { DesktopData } from './types';
import PostListApp from '../apps/PostListApp';
import RecommendationsApp from '../apps/RecommendationsApp';
import GalleryApp from '../apps/GalleryApp';
import GoalsApp from '../apps/GoalsApp';
import HistoryApp from '../apps/HistoryApp';
import AboutApp from '../apps/AboutApp';
import SearchApp from '../apps/SearchApp';
import LinksApp from '../apps/LinksApp';
import CurrentlyApp from '../apps/CurrentlyApp';
import MediaListApp from '../apps/MediaListApp';
import DocumentWindowApp from '../apps/DocumentWindowApp';
import ProfileApp from '../apps/ProfileApp';
import GuestbookApp from '../apps/GuestbookApp';
import MusicApp from '../music/MusicApp';
import { withBase } from '../../lib/url';
import { BADGES } from '../../data/badges';

interface Props {
  data: DesktopData;
}

const WALLPAPERS = [
  { id: 'teal', label: 'Teal' },
  { id: 'clouds', label: 'Clouds' },
  { id: 'maze', label: 'Maze' },
  { id: 'stars', label: 'Starfield' },
  { id: 'glitter', label: 'Glitter' },
  { id: 'checker', label: 'Checkers' },
  { id: 'y2k', label: 'Y2K' },
  { id: 'matrix', label: 'Matrix' },
];

const WALLPAPER_STORAGE_KEY = 'devon98-wallpaper';
const GADGET_STORAGE_KEY = 'devon98-npgadget';

export default function Desktop({ data }: Props) {
  const windows = useWindowStore((s) => s.windows);
  const [wallpaper, setWallpaper] = useState('stars');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [displayPropsOpen, setDisplayPropsOpen] = useState(false);
  const [gadgetOpen, setGadgetOpen] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(WALLPAPER_STORAGE_KEY);
      if (stored) setWallpaper(stored);
      setGadgetOpen(window.localStorage.getItem(GADGET_STORAGE_KEY) !== 'closed');
    } catch {
      // localStorage unavailable — just keep the defaults.
    }
  }, []);

  function applyWallpaper(id: string) {
    setWallpaper(id);
    try {
      window.localStorage.setItem(WALLPAPER_STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }

  function toggleGadget() {
    setGadgetOpen((open) => {
      const next = !open;
      try {
        window.localStorage.setItem(GADGET_STORAGE_KEY, next ? 'open' : 'closed');
      } catch {
        // ignore
      }
      return next;
    });
  }

  function handleDesktopContextMenu(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('.window, .desktop-icon, .taskbar, .start-menu, .np-gadget')) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function renderAppContent(appId: string) {
    switch (appId) {
      case 'profile':
        return <ProfileApp diet={data.mediaDiet} />;
      case 'currently':
        return <CurrentlyApp diet={data.mediaDiet} />;
      case 'movies':
        return <MediaListApp items={data.movies} kind="movie" indexHref={withBase('/movies/')} />;
      case 'books':
        return <MediaListApp items={data.books} kind="book" indexHref={withBase('/books/')} />;
      case 'albums':
        return <MediaListApp items={data.albums} kind="album" indexHref={withBase('/albums/')} />;
      case 'music':
        return <MusicApp />;
      case 'articles':
        return <PostListApp posts={data.posts} type="article" emptyLabel="No articles yet — check back soon." />;
      case 'thinkpieces':
        return <PostListApp posts={data.posts} type="thinkpiece" emptyLabel="No think pieces yet — check back soon." />;
      case 'updates':
        return <PostListApp posts={data.posts} type="update" emptyLabel="No updates yet — check back soon." />;
      case 'recommendations':
        return <RecommendationsApp recommendations={data.recommendations} />;
      case 'gallery':
        return <GalleryApp images={data.galleryImages} />;
      case 'goals':
        return <GoalsApp months={data.months} />;
      case 'history':
        return <HistoryApp months={data.months} />;
      case 'search':
        return <SearchApp />;
      case 'links':
        return <LinksApp linksHref={withBase('/links/')} />;
      case 'guestbook':
        return <GuestbookApp />;
      case 'about':
        return <AboutApp aboutHref={withBase('/about/')} />;
      default:
        return null;
    }
  }

  return (
    <div className="desktop" data-wallpaper={wallpaper} onContextMenu={handleDesktopContextMenu}>
      <MarqueeTicker data={data} />
      <DesktopIcons />

      <div className="desktop-badge-strip">
        {BADGES.slice(0, 3).map((badge) => (
          <a key={badge.id} href={badge.href} target="_blank" rel="noopener noreferrer">
            <img src={withBase(badge.src)} alt={badge.alt} width={88} height={31} />
          </a>
        ))}
      </div>

      {windows.map((win) => (
        <Win98Window key={win.id} win={win}>
          {win.docUrl ? <DocumentWindowApp url={win.docUrl} windowId={win.id} /> : renderAppContent(win.appId)}
        </Win98Window>
      ))}

      {gadgetOpen && <NowPlayingGadget onClose={toggleGadget} />}

      {contextMenu && (
        <>
          <div className="context-menu-scrim" onClick={() => setContextMenu(null)} />
          <ul className="desktop-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
            <li>
              <button
                onClick={() => {
                  setDisplayPropsOpen(true);
                  setContextMenu(null);
                }}
              >
                Properties...
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  toggleGadget();
                  setContextMenu(null);
                }}
              >
                {gadgetOpen ? 'Hide Now Playing' : 'Show Now Playing'}
              </button>
            </li>
          </ul>
        </>
      )}

      {displayPropsOpen && (
        <div className="shutdown-overlay" onClick={() => setDisplayPropsOpen(false)}>
          <div className="window display-props-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="title-bar">
              <div className="title-bar-text">Display Properties</div>
              <div className="title-bar-controls">
                <button aria-label="Close" onClick={() => setDisplayPropsOpen(false)} />
              </div>
            </div>
            <div className="window-body">
              <p className="display-props-label">Background</p>
              <div className="wallpaper-swatches">
                {WALLPAPERS.map((wp) => (
                  <button
                    key={wp.id}
                    className={`wallpaper-swatch wallpaper-swatch-${wp.id} ${wallpaper === wp.id ? 'selected' : ''}`}
                    onClick={() => applyWallpaper(wp.id)}
                  >
                    <span>{wp.label}</span>
                  </button>
                ))}
              </div>
              <button className="display-props-ok" onClick={() => setDisplayPropsOpen(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <Taskbar gadgetOpen={gadgetOpen} onToggleGadget={toggleGadget} />
    </div>
  );
}
