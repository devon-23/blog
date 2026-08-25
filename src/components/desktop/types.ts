export interface DesktopPost {
  slug: string;
  title: string;
  summary: string;
  type: 'article' | 'thinkpiece' | 'update';
  dateLabel: string;
  href: string;
}

export interface DesktopRecommendation {
  slug: string;
  title: string;
  summary?: string;
  category: string;
  categoryLabel: string;
  categoryEmoji: string;
  dateLabel: string;
  rating?: number;
  href: string;
}

export interface DesktopMonth {
  key: string;
  label: string;
  href: string;
}

export interface DesktopGoal {
  text: string;
  done: boolean;
}

export interface DesktopData {
  posts: DesktopPost[];
  recommendations: DesktopRecommendation[];
  months: DesktopMonth[];
  currentMonthLabel: string;
  currentMonthHref: string;
  currentGoals: DesktopGoal[] | null;
}
