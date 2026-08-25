import { useEffect, useState, type ReactNode } from 'react';
import { Rnd } from 'react-rnd';
import { useWindowStore, type WindowState } from './windowStore';

interface Props {
  win: WindowState;
  children: ReactNode;
}

function useIsNarrowViewport() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 720);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return narrow;
}

export default function Win98Window({ win, children }: Props) {
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const toggleMinimize = useWindowStore((s) => s.toggleMinimize);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const moveWindow = useWindowStore((s) => s.moveWindow);
  const resizeWindow = useWindowStore((s) => s.resizeWindow);
  const isNarrow = useIsNarrowViewport();

  if (win.minimized) return null;

  const forceFullscreen = win.maximized || isNarrow;

  const size = forceFullscreen
    ? { width: '100vw', height: 'calc(100vh - 40px)' }
    : { width: win.width, height: win.height };
  const position = forceFullscreen ? { x: 0, y: 0 } : { x: win.x, y: win.y };

  return (
    <Rnd
      size={size}
      position={position}
      onDragStop={(_e, d) => !forceFullscreen && moveWindow(win.id, d.x, d.y)}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        if (forceFullscreen) return;
        resizeWindow(win.id, ref.offsetWidth, ref.offsetHeight);
        moveWindow(win.id, pos.x, pos.y);
      }}
      minWidth={280}
      minHeight={180}
      bounds="parent"
      dragHandleClassName="win98-drag-handle"
      disableDragging={forceFullscreen}
      enableResizing={!forceFullscreen}
      style={{ zIndex: win.zIndex }}
      onMouseDown={() => focusWindow(win.id)}
    >
      <div className="window win98-window">
        <div className="title-bar win98-drag-handle">
          <div className="title-bar-text">{win.title}</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize" onClick={() => toggleMinimize(win.id)} />
            <button aria-label={win.maximized ? 'Restore' : 'Maximize'} onClick={() => toggleMaximize(win.id)} disabled={isNarrow} />
            <button aria-label="Close" onClick={() => closeWindow(win.id)} />
          </div>
        </div>
        <div className="window-body win98-window-body">{children}</div>
      </div>
    </Rnd>
  );
}
