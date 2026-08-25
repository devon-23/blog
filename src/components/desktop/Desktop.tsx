import { useWindowStore } from './windowStore';
import Win98Window from './Win98Window';
import DesktopIcons from './DesktopIcons';
import Taskbar from './Taskbar';
import type { DesktopData } from './types';
import PostListApp from '../apps/PostListApp';
import RecommendationsApp from '../apps/RecommendationsApp';
import GoalsApp from '../apps/GoalsApp';
import HistoryApp from '../apps/HistoryApp';
import AboutApp from '../apps/AboutApp';
import MusicApp from '../music/MusicApp';
import { withBase } from '../../lib/url';

interface Props {
  data: DesktopData;
}

export default function Desktop({ data }: Props) {
  const windows = useWindowStore((s) => s.windows);

  function renderAppContent(appId: string) {
    switch (appId) {
      case 'music':
        return <MusicApp />;
      case 'articles':
        return <PostListApp posts={data.posts} type="article" emptyLabel="No articles yet — check back soon." />;
      case 'thinkpieces':
        return <PostListApp posts={data.posts} type="thinkpiece" emptyLabel="No think pieces yet — check back soon." />;
      case 'updates':
        return <PostListApp posts={data.posts} type="update" emptyLabel="No updates yet — check back soon." />;
      case 'recommendations':
        return <RecommendationsApp recommendations={data.recommendations} />;
      case 'goals':
        return <GoalsApp monthLabel={data.currentMonthLabel} monthHref={data.currentMonthHref} goals={data.currentGoals} />;
      case 'history':
        return <HistoryApp months={data.months} />;
      case 'about':
        return <AboutApp aboutHref={withBase('/about/')} />;
      default:
        return null;
    }
  }

  return (
    <div className="desktop">
      <DesktopIcons />

      {windows.map((win) => (
        <Win98Window key={win.id} win={win}>
          {renderAppContent(win.appId)}
        </Win98Window>
      ))}

      <Taskbar />
    </div>
  );
}
