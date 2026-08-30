import { useState } from 'react';
import { useWindowStore } from './windowStore';
import StartMenu from './StartMenu';
import Clock from './Clock';
import HitCounter from './HitCounter';
import { withBase } from '../../lib/url';

interface Props {
  /** Whether the Now Playing gadget is on screen, so the tray button can toggle it. */
  gadgetOpen: boolean;
  onToggleGadget: () => void;
}

export default function Taskbar({ gadgetOpen, onToggleGadget }: Props) {
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

      <div className="taskbar-tray">
        <HitCounter />
        <button
          className={`tray-button ${gadgetOpen ? 'active' : ''}`}
          onClick={onToggleGadget}
          title={gadgetOpen ? 'Hide Now Playing' : 'Show Now Playing'}
          aria-pressed={gadgetOpen}
        >
          ♪
        </button>
        <Clock />
      </div>
    </div>
  );
}
