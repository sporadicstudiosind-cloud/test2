import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';

export default function AchievementToast({ achievement, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 5000);
    return () => clearTimeout(timer);
  }, [achievement]);

  if (!achievement) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, var(--nexus-elevated), color-mix(in srgb, var(--nexus-accent) 8%, var(--nexus-elevated)))',
        border: '1px solid color-mix(in srgb, var(--nexus-accent) 40%, transparent)',
        minWidth: 280,
      }}
    >
      {/* Glow background */}
      <div className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at center, var(--nexus-accent), transparent 70%)' }} />

      {/* Icon */}
      <motion.div
        className="relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
        animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {achievement.icon || '🏆'}
      </motion.div>

      {/* Text */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#f59e0b' }}>
            Achievement Unlocked!
          </span>
        </div>
        <p className="font-bold text-sm mt-0.5" style={{ color: 'var(--nexus-text)' }}>
          {achievement.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--nexus-muted)' }}>
          {achievement.description}
        </p>
        <p className="text-xs font-semibold mt-1" style={{ color: 'var(--nexus-accent)' }}>
          +{achievement.pointReward} points!
        </p>
      </div>

      <button onClick={onDone} className="p-1 rounded-lg hover:opacity-70 transition-opacity flex-shrink-0"
              style={{ color: 'var(--nexus-muted)' }}>
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 rounded-b-2xl"
        style={{ background: 'var(--nexus-accent)' }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
      />
    </motion.div>
  );
}
