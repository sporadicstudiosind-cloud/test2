import { motion } from 'framer-motion';
import { X, Trophy, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../../store';
import { userApi } from '../../api';

export default function AchievementsPanel() {
  const { toggleAchievements, user } = useStore();

  const { data } = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: () => userApi.getAchievements().then(r => r.data),
    enabled: !!user,
  });

  const earned = data?.earned || [];
  const all = data?.all || [];
  const earnedIds = new Set(earned.map(e => e.achievementId));
  const totalPoints = earned.reduce((sum, e) => sum + (e.achievement?.pointReward || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
         onClick={toggleAchievements}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--nexus-surface)', border: '1px solid var(--nexus-border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4"
             style={{ borderBottom: '1px solid var(--nexus-border)' }}>
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5" style={{ color: '#f59e0b' }} />
            <h2 className="font-bold text-lg" style={{ color: 'var(--nexus-text)' }}>Achievements</h2>
            <span className="text-xs px-2 py-1 rounded-full font-semibold"
                  style={{ background: 'color-mix(in srgb, #f59e0b 15%, transparent)', color: '#f59e0b' }}>
              {earned.length}/{all.length}
            </span>
          </div>
          <button onClick={toggleAchievements} style={{ color: 'var(--nexus-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 px-6 py-4" style={{ borderBottom: '1px solid var(--nexus-border)' }}>
          <Stat label="Earned" value={earned.length} />
          <Stat label="Messages" value={user?.messageCount || 0} />
          <Stat label="Points" value={user?.points || 0} color="var(--nexus-accent)" />
        </div>

        {/* Progress */}
        <div className="px-6 py-2" style={{ borderBottom: '1px solid var(--nexus-border)' }}>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--nexus-muted)' }}>
            <span>Progress</span>
            <span>{earned.length}/{all.length} unlocked</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--nexus-elevated)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--nexus-accent), #f59e0b)' }}
              initial={{ width: 0 }}
              animate={{ width: `${all.length ? (earned.length / all.length) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Achievement grid */}
        <div className="p-6 grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
          {all.map((ach, i) => {
            const isEarned = earnedIds.has(ach.id);
            const earnedData = earned.find(e => e.achievementId === ach.id);
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{
                  background: isEarned ? 'color-mix(in srgb, #f59e0b 8%, var(--nexus-elevated))' : 'var(--nexus-elevated)',
                  border: `1px solid ${isEarned ? 'color-mix(in srgb, #f59e0b 30%, transparent)' : 'var(--nexus-border)'}`,
                  opacity: isEarned ? 1 : 0.5,
                }}
              >
                <div className="text-2xl flex-shrink-0">
                  {isEarned ? ach.icon : <Lock className="w-5 h-5" style={{ color: 'var(--nexus-muted)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: isEarned ? 'var(--nexus-text)' : 'var(--nexus-muted)' }}>
                    {ach.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--nexus-muted)' }}>{ach.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: isEarned ? '#f59e0b' : 'var(--nexus-muted)' }}>
                    +{ach.pointReward}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--nexus-muted)' }}>pts</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold" style={{ color: color || 'var(--nexus-text)' }}>{value}</p>
      <p className="text-xs" style={{ color: 'var(--nexus-muted)' }}>{label}</p>
    </div>
  );
}
