import { useState } from 'react';
import NowPlaying from './NowPlaying';
import RecentlyPlayed from './RecentlyPlayed';
import TopList from './TopList';
import FriendsGrid from './FriendsGrid';
import InfoModal, { type ModalTarget } from './InfoModal';

const TABS = [
  { id: 'overview', label: '01 Overview' },
  { id: 'recent', label: '02 Recently Played' },
  { id: 'albums', label: '03 Top Albums' },
  { id: 'tracks', label: '04 Top Tracks' },
  { id: 'artists', label: '05 Top Artists' },
  { id: 'friends', label: '06 Friends' },
];

export default function MusicApp() {
  const [activeTab, setActiveTab] = useState('overview');
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);

  return (
    <div className="music-app">
      <menu role="tablist" className="music-tabs">
        {TABS.map((tab) => (
          <li key={tab.id} role="tab" aria-selected={activeTab === tab.id}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }}>
              {tab.label}
            </a>
          </li>
        ))}
      </menu>

      <div className="window music-tab-panel" role="tabpanel">
        <div className="window-body music-panel-body">
          <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
            <NowPlaying onOpen={setModalTarget} />
          </div>
          <div style={{ display: activeTab === 'recent' ? 'block' : 'none' }}>
            <RecentlyPlayed onOpen={setModalTarget} />
          </div>
          <div style={{ display: activeTab === 'albums' ? 'block' : 'none' }}>
            <TopList method="user.gettopalbums" variant="grid" onOpen={setModalTarget} />
          </div>
          <div style={{ display: activeTab === 'tracks' ? 'block' : 'none' }}>
            <TopList method="user.gettoptracks" variant="rank" onOpen={setModalTarget} />
          </div>
          <div style={{ display: activeTab === 'artists' ? 'block' : 'none' }}>
            <TopList method="user.gettopartists" variant="rank" onOpen={setModalTarget} />
          </div>
          <div style={{ display: activeTab === 'friends' ? 'block' : 'none' }}>
            <FriendsGrid />
          </div>
        </div>
      </div>

      {modalTarget && <InfoModal target={modalTarget} onClose={() => setModalTarget(null)} onNavigate={setModalTarget} />}
    </div>
  );
}
