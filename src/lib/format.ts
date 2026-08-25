const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2026-08" -> "August 2026" */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return MONTH_LABEL_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1)));
}

/** Date -> "Aug 24, 2026" */
export function formatDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}

/** Date -> "2026-08" */
export function toMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export const TYPE_LABEL: Record<'article' | 'thinkpiece' | 'update', string> = {
  article: 'Article',
  thinkpiece: 'Think Piece',
  update: 'Update',
};
