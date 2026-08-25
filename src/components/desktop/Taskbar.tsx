import { useState } from 'react';
import { useWindowStore } from './windowStore';
import StartMenu from './StartMenu';
import Clock from './Clock';
import { withBase } from '../../lib/url';

export default function Taskbar() {
  const windows = useWindowStore((s) => s.windows);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const toggleMinimize = useWindowStore((s) => s.toggleMinimize);
  const [startOpen, setStartOpen] = useState(false);

  const topZ = windows.reduce((max, w) => (w.minimized ? max : Math.max(max, w.zIndex)), -1);

  return (
    <div className="taskbar">
      {startOpen && <StartMenu onClose={() => setStartOpen(false)} />}
      <button className={`start-button ${startOpen ? 'active' : ''}`} onClick={() => setStartOpen((v) => !v)}>
        <img src={withBase('/favicon.svg')} alt="" />
        Start
      </button>

      <div className="taskbar-windows">
        {windows.map((w) => {
          const isActive = !w.minimized && w.zIndex === topZ;
          return (
            <button
              key={w.id}
              className={`taskbar-window-button ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (isActive) {
                  toggleMinimize(w.id);
                } else {
                  if (w.minimized) toggleMinimize(w.id);
                  focusWindow(w.id);
                }
              }}
            >
              {w.title}
            </button>
          );
        })}
      </div>

      <Clock />
    </div>
  );
}
