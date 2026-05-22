import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import UserHoverCard from '../ui/UserHoverCard';

export default function UsersSidebar() {
  const { onlineUsers } = useStore();
  const [hoveredUser, setHoveredUser] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const hoverTimer = useRef(null);

  const handleMouseEnter = (user, e) => {
    clearTimeout(hoverTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPos({ x: rect.left - 260, y: rect.top });
    hoverTimer.current = setTimeout(() => setHoveredUser(user), 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoveredUser(null), 200);
  };

  return (
    <div className="w-56 flex-shrink-0 flex flex-col overflow-hidden"
         style={{ background: 'var(--nexus-surface)', borderLeft: '1px solid var(--nexus-border)' }}>
      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--nexus-border)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--nexus-muted)' }}>
          Online — {onlineUsers.length}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2">
        {onlineUsers.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: 'var(--nexus-muted)' }}>No one online yet</p>
        )}

        {onlineUsers.map(user => (
          <motion.div
            key={user.id}
            className="relative flex items-center gap-2.5 px-2 py-2 rounded-xl cursor-pointer transition-colors"
            style={{ color: 'var(--nexus-text)' }}
            whileHover={{ background: 'var(--nexus-elevated)' }}
            onMouseEnter={(e) => handleMouseEnter(user, e)}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            layout
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-violet-500/50 transition-all">
                {user.pfpUrl ? (
                  <img src={user.pfpUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white"
                       style={{ background: 'var(--nexus-accent)' }}>
                    {user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              {/* Online dot */}
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                   style={{ background: 'var(--nexus-online)', borderColor: 'var(--nexus-surface)' }}>
                <div className="online-pulse absolute inset-0 rounded-full" style={{ background: 'var(--nexus-online)' }} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.username}</p>
              {user.bio && (
                <p className="text-xs truncate" style={{ color: 'var(--nexus-muted)' }}>{user.bio}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hover card */}
      <AnimatePresence>
        {hoveredUser && (
          <UserHoverCard
            user={hoveredUser}
            position={hoverPos}
            onMouseEnter={() => clearTimeout(hoverTimer.current)}
            onMouseLeave={handleMouseLeave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
