export interface AppMeta {
  id: string;
  title: string;
  icon: string;
  width: number;
  height: number;
}

export const APPS: AppMeta[] = [
  { id: 'music', title: 'Music', icon: 'music.svg', width: 640, height: 520 },
  { id: 'articles', title: 'Articles', icon: 'articles.svg', width: 480, height: 480 },
  { id: 'thinkpieces', title: 'Think Pieces', icon: 'thinkpieces.svg', width: 480, height: 480 },
  { id: 'updates', title: 'Updates', icon: 'updates.svg', width: 480, height: 480 },
  { id: 'recommendations', title: 'Recommendations', icon: 'recommendations.svg', width: 520, height: 520 },
  { id: 'gallery', title: 'Gallery', icon: 'gallery.svg', width: 540, height: 480 },
  { id: 'goals', title: 'Goals', icon: 'goals.svg', width: 400, height: 380 },
  { id: 'history', title: 'History', icon: 'history.svg', width: 420, height: 460 },
  { id: 'search', title: 'Search', icon: 'search.svg', width: 460, height: 440 },
  { id: 'links', title: 'Links', icon: 'links.svg', width: 460, height: 380 },
  { id: 'about', title: 'About Me', icon: 'about.svg', width: 420, height: 360 },
];
