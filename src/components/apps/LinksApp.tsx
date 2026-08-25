import { BADGES } from '../../data/badges';
import { withBase } from '../../lib/url';

interface Props {
  linksHref: string;
}

export default function LinksApp({ linksHref }: Props) {
  return (
    <div className="app-links">
      <p>Places elsewhere on the internet.</p>
      <ul className="app-links-list">
        <li>
          <a href="https://github.com/devon-23" target="_blank" rel="noopener noreferrer">
            github.com/devon-23
          </a>
        </li>
        <li>
          <a href="https://www.last.fm/user/devonbarks" target="_blank" rel="noopener noreferrer">
            last.fm/user/devonbarks
          </a>
        </li>
      </ul>
      <div className="badge-strip">
        {BADGES.map((badge) =>
          badge.href ? (
            <a key={badge.id} href={badge.href} target="_blank" rel="noopener noreferrer">
              <img src={withBase(badge.src)} alt={badge.alt} width={88} height={31} />
            </a>
          ) : (
            <img key={badge.id} src={withBase(badge.src)} alt={badge.alt} width={88} height={31} />
          )
        )}
      </div>
      <a className="app-links-full" href={linksHref}>
        Full links page &rarr;
      </a>
    </div>
  );
}
