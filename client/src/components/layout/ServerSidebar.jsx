import { motion } from 'framer-motion';
import { Search, ShoppingBag, Settings, Trophy, LogOut, Zap, Plus } from 'lucide-react';
import { useStore } from '../../store';
import { useState } from 'react';
import { channelApi } from '../../api';
import toast from 'react-hot-toast';

export default function ServerSidebar() {
  const {
    user, logout, channels,
    toggleSearch, toggleShop, toggleSettings, toggleAchievements,
    setChannels,
  } = useStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await channelApi.create({ name: newName.trim() });
      const listRes = await channelApi.list();
      setChannels(listRes.data.channels);
      setCreating(false);
      setNewName('');
      toast.success(`#${res.data.channel.name} created!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create channel');
    }
  };

  const navItems = [
    { icon: Search, label: 'Search', action: toggleSearch, shortcut: 'Ctrl+K' },
    { icon: ShoppingBag, label: 'Shop', action: toggleShop },
    { icon: Trophy, label: 'Achievements', action: toggleAchievements },
    { icon: Settings, label: 'Settings', action: toggleSettings },
  ];

  const totalUnread = channels.reduce((a, c) => a + (c.unread || 0), 0);

  return (
    <div className="flex flex-col items-center gap-2 py-4 w-[72px] flex-shrink-0"
         style={{ background: 'var(--nexus-bg)', borderRight: '1px solid var(--nexus-border)' }}>
      {/* Logo */}
      <motion.div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg cursor-pointer mb-2 nexus-glow"
        style={{ background: 'linear-gradient(135deg, var(--nexus-accent), #06b6d4)' }}
        whileHover={{ scale: 1.08, borderRadius: '30%' }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <Zap className="w-6 h-6" />
      </motion.div>

      <div className="w-8 h-px my-1" style={{ background: 'var(--nexus-border)' }} />

      {/* Nav actions */}
      {navItems.map(({ icon: Icon, label, action }) => (
        <NavButton key={label} icon={<Icon className="w-5 h-5" />} label={label} onClick={action}
                   badge={label === 'Search' && totalUnread > 0 ? totalUnread : undefined} />
      ))}

      {/* Create channel */}
      <NavButton
        icon={<Plus className="w-5 h-5" />}
        label="New Channel"
        onClick={() => setCreating(true)}
      />

      {/* User points */}
      {user && (
        <div className="mt-auto flex flex-col items-center gap-1">
          <div className="text-xs font-bold" style={{ color: 'var(--nexus-accent)' }}>
            {user.points}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--nexus-muted)' }}>pts</div>
        </div>
      )}

      {/* Avatar + logout */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <motion.div
          className="relative w-10 h-10 rounded-full overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-violet-500 transition-all"
          whileHover={{ scale: 1.08 }}
          onClick={toggleSettings}
        >
          {user?.pfpUrl ? (
            <img src={user.pfpUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white"
                 style={{ background: 'var(--nexus-accent)' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
               style={{ background: 'var(--nexus-online)', borderColor: 'var(--nexus-bg)' }} />
        </motion.div>

        <motion.button
          onClick={logout}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{ color: 'var(--nexus-muted)' }}
          whileHover={{ color: 'var(--nexus-danger)', background: 'color-mix(in srgb, var(--nexus-danger) 10%, transparent)' }}
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Create channel modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
             onClick={() => setCreating(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="nexus-glass rounded-2xl p-6 w-80 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--nexus-text)' }}>Create Channel</h3>
            <form onSubmit={handleCreateChannel} className="flex flex-col gap-3">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="channel-name"
                className="nexus-input"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" className="nexus-btn flex-1">Create</button>
                <button type="button" className="nexus-btn-ghost flex-1" onClick={() => setCreating(false)}>Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function NavButton({ icon, label, onClick, badge }) {
  return (
    <div className="relative group">
      <motion.button
        onClick={onClick}
        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
        style={{ color: 'var(--nexus-muted)', background: 'transparent' }}
        whileHover={{
          scale: 1.08,
          borderRadius: '30%',
          color: 'var(--nexus-text)',
          background: 'var(--nexus-elevated)',
        }}
        whileTap={{ scale: 0.92 }}
        title={label}
      >
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-bold text-white px-1"
                style={{ background: 'var(--nexus-danger)' }}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </motion.button>

      {/* Tooltip */}
      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
           style={{ background: 'var(--nexus-elevated)', color: 'var(--nexus-text)', border: '1px solid var(--nexus-border)' }}>
        {label}
      </div>
    </div>
  );
}
