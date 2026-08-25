import { useState } from 'react';
import { APPS } from './appRegistry';
import { useWindowStore } from './windowStore';
import { withBase } from '../../lib/url';

interface Props {
  onClose: () => void;
}

export default function StartMenu({ onClose }: Props) {
  const openWindow = useWindowStore((s) => s.openWindow);
  const [shutdownMessage, setShutdownMessage] = useState(false);

  return (
    <div className="start-menu">
      <div className="start-menu-banner">
        <span>devon 98</span>
      </div>
      <ul className="start-menu-items">
        {APPS.map((app) => (
          <li key={app.id}>
            <button
              onClick={() => {
                openWindow({ appId: app.id, title: app.title, width: app.width, height: app.height });
                onClose();
              }}
            >
              <img src={withBase(`/icons/${app.icon}`)} alt="" />
              {app.title}
            </button>
          </li>
        ))}
        <li className="start-menu-divider" />
        <li>
          <button onClick={() => setShutdownMessage(true)}>
            <img src={withBase('/icons/recyclebin.svg')} alt="" />
            Shut Down...
          </button>
        </li>
      </ul>

      {shutdownMessage && (
        <div className="shutdown-overlay" onClick={() => setShutdownMessage(false)}>
          <div className="window shutdown-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="title-bar">
              <div className="title-bar-text">Shut Down devon 98</div>
            </div>
            <div className="window-body">
              <p>It's just a website — nothing to shut down. Close the tab if you're really done.</p>
              <button onClick={() => setShutdownMessage(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
