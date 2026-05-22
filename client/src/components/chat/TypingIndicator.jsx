import { motion } from 'framer-motion';

export default function TypingIndicator({ users }) {
  if (!users.length) return null;

  const text = users.length === 1
    ? `${users[0]} is typing`
    : users.length === 2
    ? `${users[0]} and ${users[1]} are typing`
    : `${users.length} people are typing`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex items-center gap-2 px-4 py-1"
    >
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl"
           style={{ background: 'var(--nexus-elevated)' }}>
        <div className="flex gap-1">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
        <span className="text-xs ml-1" style={{ color: 'var(--nexus-muted)' }}>
          {text}
        </span>
      </div>
    </motion.div>
  );
}
