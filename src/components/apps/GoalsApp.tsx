import type { DesktopGoal } from '../desktop/types';

interface Props {
  monthLabel: string;
  monthHref: string;
  goals: DesktopGoal[] | null;
}

export default function GoalsApp({ monthLabel, monthHref, goals }: Props) {
  return (
    <div className="app-goals">
      <p className="app-goals-heading">Goals for {monthLabel}</p>
      {!goals || goals.length === 0 ? (
        <p className="app-empty">No goals drawn for this month yet — run `npm run new:month`.</p>
      ) : (
        <ul className="app-goals-list">
          {goals.map((goal, i) => (
            <li key={i} className={goal.done ? 'done' : ''}>
              <span>{goal.done ? '☑' : '☐'}</span> {goal.text}
            </li>
          ))}
        </ul>
      )}
      <a className="app-goals-link" href={monthHref}>
        View full recap for {monthLabel} &rarr;
      </a>
    </div>
  );
}
