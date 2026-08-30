import type { DesktopRecommendation } from '../desktop/types';
import { useOpenDocument } from '../desktop/openDocument';

interface Props {
  recommendations: DesktopRecommendation[];
}

export default function RecommendationsApp({ recommendations }: Props) {
  const openDocument = useOpenDocument();

  if (recommendations.length === 0) {
    return <p className="app-empty">Nothing recommended yet.</p>;
  }

  const categories = Array.from(new Set(recommendations.map((r) => r.category)));

  return (
    <div>
      {categories.map((category) => {
        const items = recommendations.filter((r) => r.category === category);
        return (
          <div key={category} className="app-category-group">
            <h3>
              {items[0].categoryEmoji} {items[0].categoryLabel}
            </h3>
            <ul className="app-list">
              {items.map((rec) => (
                <li key={rec.slug}>
                  <a href={rec.href} onClick={(e) => openDocument(rec.href, rec.title, e)}>
                    {rec.coverImageSrc && <img className="app-list-thumb" src={rec.coverImageSrc} alt="" />}
                    <span className="app-list-body">
                      <span className="app-list-title">
                        {rec.title}
                        {rec.isNew && <span className="new-tag">NEW!</span>}
                      </span>
                      {rec.summary && <span className="app-list-summary">{rec.summary}</span>}
                      <span className="app-list-date">
                        {rec.rating ? '★'.repeat(rec.rating) + ' · ' : ''}
                        {rec.dateLabel}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
