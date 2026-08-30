import { useNowPlaying } from '../music/useNowPlaying';
import { PROFILE, PROFILES } from '../../data/profiles';
import { useWindowStore } from '../desktop/windowStore';
import { APPS } from '../desktop/appRegistry';
import type { DesktopMediaDiet } from '../desktop/types';

// The MySpace profile, more or less faithfully: contact table on the left,
// blurb and interests on the right, Top 8 at the bottom, and a "currently
// listening" line that's actually live instead of an autoplaying embed.

interface Props {
  diet: DesktopMediaDiet;
}

export default function ProfileApp({ diet }: Props) {
  const np = useNowPlaying();
  const openWindow = useWindowStore((s) => s.openWindow);
  const lastFilm = diet.films[0];
  const reading = diet.readingNow[0] ?? diet.finishedBooks[0];

  function open(appId: string) {
    const app = APPS.find((a) => a.id === appId);
    if (app) openWindow({ appId: app.id, title: app.title, width: app.width, height: app.height });
  }

  return (
    <div className="profile-app">
      <div className="profile-banner">
        <span className="glitter-text">{PROFILE.displayName}</span>
        <span className="profile-tagline">{PROFILE.tagline}</span>
      </div>

      <div className="profile-columns">
        <div className="profile-side">
          <div className="profile-pic">
            <div className="profile-pic-inner">
              <span>:)</span>
            </div>
            <span className="profile-pic-caption">that's me</span>
          </div>

          <table className="profile-contact">
            <tbody>
              <tr>
                <th>Status</th>
                <td>
                  <span className="status-dot" /> {PROFILE.status}
                </td>
              </tr>
              <tr>
                <th>Mood</th>
                <td>
                  {PROFILE.moodEmoji} {PROFILE.mood}
                </td>
              </tr>
              <tr>
                <th>Here</th>
                <td>{PROFILE.location}</td>
              </tr>
              <tr>
                <th>Hearing</th>
                <td>
                  {np.status === 'ready' ? (
                    <a href={np.trackUrl} target="_blank" rel="noopener noreferrer">
                      {np.title}
                    </a>
                  ) : (
                    '…'
                  )}
                </td>
              </tr>
              {lastFilm && (
                <tr>
                  <th>Watched</th>
                  <td>
                    <a
                      href={lastFilm.href ?? lastFilm.externalUrl}
                      {...(lastFilm.href ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                    >
                      {lastFilm.title}
                    </a>
                  </td>
                </tr>
              )}
              {reading && (
                <tr>
                  <th>Reading</th>
                  <td>
                    <a
                      href={reading.href ?? reading.externalUrl}
                      {...(reading.href ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                    >
                      {reading.title}
                    </a>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <button className="profile-cta" onClick={() => open('guestbook')}>
            ✎ Sign my guestbook
          </button>
          <button className="profile-cta" onClick={() => open('currently')}>
            ⌖ See everything I'm into
          </button>
        </div>

        <div className="profile-main">
          <section className="profile-box">
            <h3>About me</h3>
            {PROFILE.blurb.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </section>

          <section className="profile-box">
            <h3>{PROFILE.displayName}'s Interests</h3>
            <table className="profile-interests">
              <tbody>
                {PROFILE.interests.map((row) => (
                  <tr key={row.label}>
                    <th>{row.label}</th>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="profile-box">
            <h3>
              {PROFILE.displayName}'s Top {PROFILE.topFriends.length}
            </h3>
            <ul className="top-friends">
              {PROFILE.topFriends.map((friend) => {
                const inner = (
                  <>
                    <span className="friend-tile">{friend.tag}</span>
                    <span className="friend-name">{friend.name}</span>
                    <span className="friend-blurb">{friend.blurb}</span>
                  </>
                );
                return (
                  <li key={friend.name}>
                    {friend.href ? (
                      <a href={friend.href} target="_blank" rel="noopener noreferrer">
                        {inner}
                      </a>
                    ) : (
                      <span>{inner}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="profile-box">
            <h3>Find me</h3>
            <ul className="profile-elsewhere">
              <li>
                <a href={PROFILES.lastfm.url} target="_blank" rel="noopener noreferrer">
                  Last.fm
                </a>{' '}
                — everything I've ever pressed play on
              </li>
              <li>
                <a href={PROFILES.letterboxd.url} target="_blank" rel="noopener noreferrer">
                  Letterboxd
                </a>{' '}
                — the film diary
              </li>
              <li>
                <a href={PROFILES.goodreads.url} target="_blank" rel="noopener noreferrer">
                  Goodreads
                </a>{' '}
                — the reading log
              </li>
              <li>
                <a href={PROFILES.github.url} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>{' '}
                — including the source of this desktop
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
