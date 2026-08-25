export interface DesktopPost {
  slug: string;
  title: string;
  summary: string;
  type: 'article' | 'thinkpiece' | 'update';
  dateLabel: string;
  href: string;
  coverImageSrc?: string;
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
  coverImageSrc?: string;
}

export interface DesktopGoal {
  text: string;
  done: boolean;
  logHref?: string;
}

export interface DesktopMonth {
  key: string;
  label: string;
  href: string;
  goals: DesktopGoal[] | null;
}

export interface DesktopGalleryImage {
  src: string;
  width: number;
  height: number;
  sourceTitle: string;
  sourceHref: string;
  sourceKind: string;
  dateLabel: string;
}

export interface DesktopData {
  posts: DesktopPost[];
  recommendations: DesktopRecommendation[];
  months: DesktopMonth[];
  galleryImages: DesktopGalleryImage[];
}
