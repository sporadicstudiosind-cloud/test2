import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Smile, Trash2, Edit2, Link, MoreHorizontal } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useStore } from '../../store';
import { messageApi } from '../../api';
import LinkPreview from './LinkPreview';
import toast from 'react-hot-toast';

const URL_REGEX = /(https?:\/\/[^\s<>'"]+)/g;
const MENTION_REGEX = /@(\w+)/g;

function renderContent(content, currentUser) {
  const parts = [];
  let last = 0;
  const combined = [...content.matchAll(new RegExp(`${URL_REGEX.source}|${MENTION_REGEX.source}`, 'g'))];

  if (combined.length === 0) return [content];

  for (const match of combined) {
    if (match.index > last) parts.push(content.slice(last, match.index));
    if (match[0].startsWith('http')) {
      parts.push(<a key={match.index} href={match[0]} target="_blank" rel="noopener noreferrer"
                    className="underline font-medium hover:opacity-80" style={{ color: 'var(--nexus-accent)' }}>{match[0]}</a>);
    } else {
      const isSelf = match[1] === currentUser?.username;
      parts.push(
        <span key={match.index} className={`mention ${isSelf ? 'ring-1 ring-violet-500/40' : ''}`}>
          @{match[1]}
        </span>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < content.length) parts.push(content.slice(last));
  return parts;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '😮', '👎'];

export default function MessageBubble({ message, showAvatar, isOwn, chatKey }) {
  const { user, updateReactions, deleteMessage: removeMsg } = useStore();
  const [showPicker, setShowPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const pickerRef = useRef(null);

  const author = message.user || message.sender;
  const content = message.content || '';
  const reactions = message.reactions || [];
  const urls = [...content.matchAll(URL_REGEX)].map(m => m[0]);
  const isExpired = !!message.mediaExpiredAt;

  const groupReactions = () => {
    const map = {};
    reactions.forEach(r => {
      if (!map[r.emoji]) map[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasMe: false };
      map[r.emoji].count++;
      map[r.emoji].users.push(r.user?.username);
      if (r.userId === user?.id || r.user?.id === user?.id) map[r.emoji].hasMe = true;
    });
    return Object.values(map);
  };

  const handleReact = async (emoji) => {
    try {
      const res = await messageApi.react(message.id, emoji, 'channel');
    } catch (err) {
      toast.error('Failed to react');
    }
    setShowPicker(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await messageApi.delete(message.id);
      removeMsg(chatKey, message.id);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    try {
      await messageApi.edit(message.id, editContent);
      setEditing(false);
    } catch {
      toast.error('Failed to edit');
    }
  };

  const grouped = groupReactions();

  return (
    <motion.div
      className="group flex items-start gap-3 px-2 py-0.5 rounded-xl hover:bg-white/[0.02] transition-colors relative message-bubble"
      style={{ marginTop: showAvatar ? '12px' : '0' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowPicker(false); }}
      layout
    >
      {/* Avatar */}
      <div className="w-10 flex-shrink-0 mt-0.5">
        {showAvatar && author && (
          <motion.div
            className="w-9 h-9 rounded-full overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {author.pfpUrl ? (
              <img src={author.pfpUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white"
                   style={{ background: 'var(--nexus-accent)' }}>
                {author.username?.[0]?.toUpperCase()}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {showAvatar && author && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-sm" style={{ color: isOwn ? 'var(--nexus-accent)' : 'var(--nexus-text)' }}>
              {author.username}
            </span>
            <span className="text-xs" style={{ color: 'var(--nexus-muted)' }}>
              {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : ''}
            </span>
            {message.isEdited && (
              <span className="text-xs" style={{ color: 'var(--nexus-muted)' }}>(edited)</span>
            )}
          </div>
        )}

        {/* Text */}
        {editing ? (
          <form onSubmit={handleEdit} className="flex gap-2 mt-1">
            <input
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="nexus-input flex-1 py-1.5 text-sm"
              autoFocus
              onKeyDown={e => { if (e.key === 'Escape') setEditing(false); }}
            />
            <button type="submit" className="nexus-btn text-xs px-3">Save</button>
            <button type="button" className="nexus-btn-ghost text-xs px-3" onClick={() => setEditing(false)}>Cancel</button>
          </form>
        ) : (
          <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--nexus-text)' }}>
            {renderContent(content, user)}
          </p>
        )}

        {/* Media */}
        {message.mediaUrl && !isExpired && (
          <MediaDisplay url={message.mediaUrl} type={message.mediaType} />
        )}
        {isExpired && message.mediaType && (
          <div className="mt-2 px-3 py-2 rounded-lg text-xs italic"
               style={{ background: 'var(--nexus-elevated)', color: 'var(--nexus-muted)' }}>
            [Media Expired]
          </div>
        )}

        {/* Link previews */}
        {urls.length > 0 && !message.mediaUrl && (
          <div className="mt-2 flex flex-col gap-2">
            {urls.slice(0, 1).map(url => <LinkPreview key={url} url={url} />)}
          </div>
        )}

        {/* Reactions */}
        {grouped.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {grouped.map(r => (
              <motion.button
                key={r.emoji}
                className={`reaction-pill ${r.hasMe ? 'reacted' : ''}`}
                onClick={() => handleReact(r.emoji)}
                whileTap={{ scale: 0.9 }}
                title={r.users.join(', ')}
              >
                <span>{r.emoji}</span>
                <span className="text-xs font-semibold">{r.count}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Action bar */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-4 -top-3 flex items-center gap-1 rounded-xl px-2 py-1.5 shadow-xl z-10"
            style={{ background: 'var(--nexus-elevated)', border: '1px solid var(--nexus-border)' }}
          >
            {/* Quick reactions */}
            {QUICK_EMOJIS.map(emoji => (
              <motion.button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="text-base hover:scale-125 transition-transform"
                whileTap={{ scale: 0.8 }}
                title={`React with ${emoji}`}
              >
                {emoji}
              </motion.button>
            ))}

            <div className="w-px h-4 mx-1" style={{ background: 'var(--nexus-border)' }} />

            {/* Full picker */}
            <ActionBtn icon={<Smile className="w-4 h-4" />} onClick={() => setShowPicker(v => !v)} title="Add reaction" />

            {isOwn && (
              <>
                <ActionBtn icon={<Edit2 className="w-4 h-4" />} onClick={() => { setEditing(true); setShowActions(false); }} title="Edit" />
                <ActionBtn icon={<Trash2 className="w-4 h-4" />} onClick={handleDelete} title="Delete" danger />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute right-4 top-6 z-50"
            ref={pickerRef}
          >
            <EmojiPicker
              onEmojiClick={(e) => handleReact(e.emoji)}
              theme="dark"
              skinTonesDisabled
              searchDisabled={false}
              height={350}
              width={300}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ActionBtn({ icon, onClick, title, danger }) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      className="p-1 rounded-lg transition-colors"
      style={{ color: danger ? 'var(--nexus-danger)' : 'var(--nexus-muted)' }}
      whileHover={{ color: danger ? 'var(--nexus-danger)' : 'var(--nexus-text)', background: 'var(--nexus-surface)' }}
      whileTap={{ scale: 0.9 }}
    >
      {icon}
    </motion.button>
  );
}

function MediaDisplay({ url, type }) {
  if (type === 'image' || type === 'gif') {
    return (
      <motion.div className="mt-2 max-w-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <img
          src={url}
          alt="media"
          className="rounded-xl max-h-80 object-contain cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(url, '_blank')}
          loading="lazy"
        />
      </motion.div>
    );
  }
  if (type === 'video') {
    return (
      <video src={url} controls className="mt-2 max-w-md rounded-xl max-h-80"
             style={{ background: 'var(--nexus-elevated)' }} />
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:opacity-80 transition-opacity inline-flex"
       style={{ background: 'var(--nexus-elevated)', color: 'var(--nexus-accent)', border: '1px solid var(--nexus-border)' }}>
      <Link className="w-4 h-4" />
      Download file
    </a>
  );
}
