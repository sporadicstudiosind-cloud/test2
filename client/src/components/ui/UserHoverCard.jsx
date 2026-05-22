import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../api';
import { useStore } from '../../store';
import { Trophy, MessageSquare } from 'lucide-react';

export default function UserHoverCard({ user, position, onMouseEnter, onMouseLeave }) {
  const { onlineUsers } = useStore();
  const isOnline = onlineUsers.some(u => u.id === user.id);

  const { data } = useQuery({
    queryKey: ['user', user.id],
    queryFn: () => userApi.get(user.id).then(r => r.data.user),
    staleTime: 120_000,
  });

  const fullUser = data || user;
  const achievements = data?.userAchievements?.slice(0, 3) || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 8 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="fixed z-50 w-64 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        left: position.x,
        top: Math.min(position.y, window.innerHeight - 300),
        border: '1px solid var(--nexus-border)',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Banner / card background */}
      <div className="relative h-24 overflow-hidden">
        {fullUser.cardBgUrl ? (
          <img src={fullUser.cardBgUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full"
               style={{ background: 'linear-gradient(135deg, var(--nexus-accent), color-mix(in srgb, var(--nexus-accent) 40%, #06b6d4))' }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))' }} />
      </div>

      {/* Body */}
      <div className="px-4 pb-4" style={{ background: 'var(--nexus-elevated)', marginTop: '-1px' }}>
        {/* Avatar */}
        <div className="flex items-end justify-between -mt-8 mb-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-4"
                 style={{ ringColor: 'var(--nexus-elevated)', border: '4px solid var(--nexus-elevated)' }}>
              {fullUser.pfpUrl ? (
                <img src={fullUser.pfpUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                     style={{ background: 'var(--nexus-accent)' }}>
                  {fullUser.username[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2"
                 style={{ background: isOnline ? 'var(--nexus-online)' : 'var(--nexus-muted)', borderColor: 'var(--nexus-elevated)' }} />
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
               style={{
                 background: isOnline ? 'color-mix(in srgb, var(--nexus-online) 15%, transparent)' : 'var(--nexus-surface)',
                 color: isOnline ? 'var(--nexus-online)' : 'var(--nexus-muted)',
               }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: isOnline ? 'var(--nexus-online)' : 'var(--nexus-muted)' }} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* Info */}
        <h3 className="font-bold text-base" style={{ color: 'var(--nexus-text)' }}>{fullUser.username}</h3>

        {fullUser.bio && (
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--nexus-muted)' }}>
            {fullUser.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--nexus-border)' }}>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--nexus-muted)' }}>
            <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--nexus-accent)' }} />
            <span>{fullUser.messageCount || 0} messages</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--nexus-muted)' }}>
            <Trophy className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
            <span>{fullUser.points || 0} pts</span>
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {achievements.map(ua => (
              <span key={ua.id} title={ua.achievement.title}
                    className="text-base cursor-default" style={{ lineHeight: 1 }}>
                {ua.achievement.icon}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
