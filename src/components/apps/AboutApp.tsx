import { PROFILE } from '../../data/profiles';
import { useWindowStore } from '../desktop/windowStore';
import { APPS } from '../desktop/appRegistry';

interface Props {
  aboutHref: string;
}

export default function AboutApp({ aboutHref }: Props) {
  const openWindow = useWindowStore((s) => s.openWindow);

  function open(appId: string) {
    const app = APPS.find((a) => a.id === appId);
    if (app) openWindow({ appId: app.id, title: app.title, width: app.width, height: app.height });
  }

  return (
    <div className="app-about">
      {PROFILE.blurb.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
      <p>
        The fuller version lives in <button className="linklike" onClick={() => open('profile')}>My Profile</button>, and what
        I'm actually watching / reading / hearing right now is in{' '}
        <button className="linklike" onClick={() => open('currently')}>Currently</button>.
      </p>
      <a href={aboutHref}>Read the full about page &rarr;</a>
    </div>
  );
}
