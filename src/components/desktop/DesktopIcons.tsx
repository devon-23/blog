import { APPS } from './appRegistry';
import { useWindowStore } from './windowStore';
import { withBase } from '../../lib/url';

export default function DesktopIcons() {
  const openWindow = useWindowStore((s) => s.openWindow);

  return (
    <div className="desktop-icons">
      {APPS.map((app) => (
        <button
          key={app.id}
          className="desktop-icon"
          onDoubleClick={() => openWindow({ appId: app.id, title: app.title, width: app.width, height: app.height })}
          onClick={(e) => {
            // Support single tap/click on touch devices where double-click is awkward.
            if (e.detail === 1 && 'ontouchstart' in window) {
              openWindow({ appId: app.id, title: app.title, width: app.width, height: app.height });
            }
          }}
        >
          <img src={withBase(`/icons/${app.icon}`)} alt="" draggable={false} />
          <span>{app.title}</span>
        </button>
      ))}
    </div>
  );
}
