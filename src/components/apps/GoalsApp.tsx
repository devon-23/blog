import { useEffect, useState } from 'react';
import type { DesktopMonth } from '../desktop/types';
import { toMonthKey, formatMonthLabel } from '../../lib/format';

interface Props {
  months: DesktopMonth[];
}

export default function GoalsApp({ months }: Props) {
  // Computed on the client (not baked in at build time) so this always
  // reflects the visitor's actual current month, even if the site hasn't
  // been rebuilt since the month changed.
  const [monthKey, setMonthKey] = useState<string | null>(null);

  useEffect(() => {
    setMonthKey(toMonthKey(new Date()));
  }, []);

  if (!monthKey) return null;

  const current = months.find((m) => m.key === monthKey);
  const label = current?.label ?? formatMonthLabel(monthKey);
  const goals = current?.goals ?? null;

  return (
    <div className="app-goals">
      <p className="app-goals-heading">Goals for {label}</p>
      {!goals || goals.length === 0 ? (
        <p className="app-empty">No goals drawn for this month yet — run `npm run new:month`.</p>
      ) : (
        <ul className="app-goals-list">
          {goals.map((goal, i) => (
            <li key={i} className={goal.done ? 'done' : ''}>
              <span>{goal.done ? '☑' : '☐'}</span> {goal.text}
              {goal.logHref ? (
                <a className="goal-log-link" href={goal.logHref}>
                  photos &amp; notes &rarr;
                </a>
              ) : (
                <span className="goal-log-hint"> (no log yet — `npm run log:goal`)</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {current && (
        <a className="app-goals-link" href={current.href}>
          View full recap for {label} &rarr;
        </a>
      )}
    </div>
  );
}
