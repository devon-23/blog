import type { DesktopMonth } from '../desktop/types';

interface Props {
  months: DesktopMonth[];
}

export default function HistoryApp({ months }: Props) {
  if (months.length === 0) {
    return <p className="app-empty">No months yet.</p>;
  }

  return (
    <ul className="tree-view app-history-list">
      {months.map((month) => (
        <li key={month.key}>
          <a href={month.href}>{month.label}</a>
        </li>
      ))}
    </ul>
  );
}
