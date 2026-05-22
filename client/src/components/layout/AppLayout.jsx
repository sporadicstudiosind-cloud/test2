import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { channelApi } from '../../api';
import ServerSidebar from './ServerSidebar';
import ChannelSidebar from './ChannelSidebar';
import ChatArea from '../chat/ChatArea';
import UsersSidebar from './UsersSidebar';
import SearchModal from '../ui/SearchModal';
import ShopModal from '../shop/ShopModal';
import UserSettings from '../settings/UserSettings';
import AchievementsPanel from '../ui/AchievementsPanel';

export default function AppLayout() {
  const { setChannels, showSearch, showShop, showSettings, showAchievements } = useStore();

  useEffect(() => {
    channelApi.list().then(res => setChannels(res.data.channels));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--nexus-bg)' }}>
      {/* Server/Nav sidebar - thin icon bar */}
      <ServerSidebar />

      {/* Channel list */}
      <ChannelSidebar />

      {/* Main chat */}
      <div className="flex-1 flex overflow-hidden">
        <ChatArea />
        <UsersSidebar />
      </div>

      {/* Modals */}
      {showSearch && <SearchModal />}
      {showShop && <ShopModal />}
      {showSettings && <UserSettings />}
      {showAchievements && <AchievementsPanel />}
    </div>
  );
}
