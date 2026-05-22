import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Volume2, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { useStore } from '../../store';
import { channelApi, userApi } from '../../api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getSocket } from '../../hooks/useSocket';
import { clsx } from 'clsx';

export default function ChannelSidebar() {
  const { channels, activeChannel, activeDM, setActiveChannel, setActiveDM, user, markChannelRead } = useStore();
  const [dmOpen, setDmOpen] = useState(true);
  const [chOpen, setChOpen] = useState(true);

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.list().then(r => r.data.users),
    staleTime: 60_000,
  });

  const textChannels = channels.filter(ch => !ch.isVoice);
  const voiceChannels = channels.filter(ch => ch.isVoice);
  const otherUsers = usersData?.filter(u => u.id !== user?.id) || [];

  const handleChannelClick = async (ch) => {
    const socket = getSocket();
    if (activeChannel) socket?.emit('leaveChannel', { channelId: activeChannel.id });
    setActiveChannel(ch);
    socket?.emit('joinChannel', { channelId: ch.id });
    markChannelRead(ch.id);
    try { await channelApi.markRead(ch.id); } catch {}
  };

  const handleDMClick = (u) => {
    const socket = getSocket();
    socket?.emit('joinDM', { userId: u.id });
    setActiveDM(u);
  };

  return (
    <div className="w-60 flex-shrink-0 flex flex-col overflow-hidden"
         style={{ background: 'var(--nexus-surface)', borderRight: '1px solid var(--nexus-border)' }}>
      {/* Server name */}
      <div className="px-4 py-4 flex items-center justify-between"
           style={{ borderBottom: '1px solid var(--nexus-border)' }}>
        <h2 className="font-bold text-sm tracking-wide" style={{ color: 'var(--nexus-text)' }}>
          ⚡ Nexus Server
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2">
        {/* Text Channels */}
        <SectionHeader
          open={chOpen}
          onToggle={() => setChOpen(v => !v)}
          label="Channels"
        />
        <AnimatePresence>
          {chOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
              {textChannels.map(ch => (
                <ChannelItem
                  key={ch.id}
                  channel={ch}
                  isActive={activeChannel?.id === ch.id}
                  onClick={() => handleChannelClick(ch)}
                />
              ))}
              {voiceChannels.map(ch => (
                <ChannelItem
                  key={ch.id}
                  channel={ch}
                  isActive={activeChannel?.id === ch.id}
                  onClick={() => handleChannelClick(ch)}
                  isVoice
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* DMs */}
        <SectionHeader
          open={dmOpen}
          onToggle={() => setDmOpen(v => !v)}
          label="Direct Messages"
          className="mt-4"
        />
        <AnimatePresence>
          {dmOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
              {otherUsers.map(u => (
                <DMItem
                  key={u.id}
                  user={u}
                  isActive={activeDM?.id === u.id}
                  onClick={() => handleDMClick(u)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SectionHeader({ open, onToggle, label, className = '' }) {
  return (
    <button
      onClick={onToggle}
      className={clsx('flex items-center gap-1 w-full px-2 py-1 mb-1 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors', className)}
      style={{ color: 'var(--nexus-muted)' }}
    >
      {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      {label}
    </button>
  );
}

function ChannelItem({ channel, isActive, onClick, isVoice }) {
  const { onlineUsers } = useStore();
  const Icon = isVoice ? Volume2 : Hash;
  const tags = (() => { try { return JSON.parse(channel.tags || '[]'); } catch { return []; } })();

  return (
    <motion.button
      onClick={onClick}
      className={clsx(
        'relative flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left',
        isActive ? 'sidebar-item-active' : 'hover:bg-white/5'
      )}
      style={{ color: isActive ? 'var(--nexus-text)' : 'var(--nexus-muted)' }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate font-medium">{channel.name}</span>
      {(channel.unread || 0) > 0 && !isActive && (
        <span className="ml-auto text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center"
              style={{ background: 'var(--nexus-danger)', color: 'white' }}>
          {channel.unread > 99 ? '99+' : channel.unread}
        </span>
      )}
    </motion.button>
  );
}

function DMItem({ user, isActive, onClick }) {
  const { onlineUsers } = useStore();
  const isOnline = onlineUsers.some(u => u.id === user.id);

  return (
    <motion.button
      onClick={onClick}
      className={clsx(
        'relative flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left',
        isActive ? 'sidebar-item-active' : 'hover:bg-white/5'
      )}
      style={{ color: isActive ? 'var(--nexus-text)' : 'var(--nexus-muted)' }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative flex-shrink-0">
        <div className="w-7 h-7 rounded-full overflow-hidden">
          {user.pfpUrl ? (
            <img src={user.pfpUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                 style={{ background: 'var(--nexus-accent)' }}>
              {user.username[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className={clsx('absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2')}
             style={{ background: isOnline ? 'var(--nexus-online)' : 'var(--nexus-muted)', borderColor: 'var(--nexus-surface)' }} />
      </div>
      <span className="flex-1 truncate font-medium">{user.username}</span>
    </motion.button>
  );
}
