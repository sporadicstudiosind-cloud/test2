import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, X, Image } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useStore } from '../../store';
import { messageApi } from '../../api';
import { getSocket } from '../../hooks/useSocket';
import toast from 'react-hot-toast';

const SUGGESTIONS_RE = /@(\w*)$/;

export default function MessageInput({ chatKey }) {
  const { activeChannel, activeDM, user } = useStore();
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const typingTimer = useRef(null);
  const { onlineUsers } = useStore();

  const placeholder = activeChannel
    ? `Message #${activeChannel.name}`
    : activeDM
    ? `Message ${activeDM.username}`
    : 'Select a channel';

  const emitTyping = useCallback((isTyping) => {
    const socket = getSocket();
    if (!socket) return;
    if (activeChannel) {
      socket.emit('typing', { channelId: activeChannel.id, isTyping });
    } else if (activeDM) {
      socket.emit('typingDM', { receiverId: activeDM.id, isTyping });
    }
  }, [activeChannel, activeDM]);

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);

    // Mention autocomplete
    const match = val.match(SUGGESTIONS_RE);
    setMentionQuery(match ? match[1] : null);

    // Typing indicator
    clearTimeout(typingTimer.current);
    emitTyping(true);
    typingTimer.current = setTimeout(() => emitTyping(false), 3000);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const send = async (e) => {
    e?.preventDefault();
    if (!content.trim() && !file) return;
    if (!activeChannel && !activeDM) return;

    setLoading(true);
    emitTyping(false);
    clearTimeout(typingTimer.current);

    try {
      const formData = new FormData();
      if (content.trim()) formData.append('content', content.trim());
      if (file) formData.append('media', file);

      if (activeChannel) {
        await messageApi.sendChannel(activeChannel.id, formData);
      } else if (activeDM) {
        await messageApi.sendDM(activeDM.id, formData);
      }

      setContent('');
      removeFile();
      inputRef.current?.focus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    if (e.key === 'Escape') {
      setShowEmoji(false);
      setMentionQuery(null);
    }
  };

  const insertEmoji = (emojiObj) => {
    setContent(c => c + emojiObj.emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const insertMention = (username) => {
    setContent(c => c.replace(SUGGESTIONS_RE, `@${username} `));
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const mentionSuggestions = mentionQuery !== null
    ? onlineUsers.filter(u => u.id !== user?.id &&
        u.username.toLowerCase().startsWith(mentionQuery.toLowerCase()))
        .slice(0, 5)
    : [];

  return (
    <div className="px-4 pb-4 pt-2 flex-shrink-0" style={{ borderTop: '1px solid var(--nexus-border)' }}>
      {/* File preview */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-3 flex items-center gap-3 px-3 py-2 rounded-xl"
            style={{ background: 'var(--nexus-elevated)', border: '1px solid var(--nexus-border)' }}
          >
            {filePreview ? (
              <img src={filePreview} alt="" className="h-16 w-16 object-cover rounded-lg" />
            ) : (
              <div className="h-16 w-16 flex items-center justify-center rounded-lg"
                   style={{ background: 'var(--nexus-surface)' }}>
                <Paperclip className="w-6 h-6" style={{ color: 'var(--nexus-accent)' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--nexus-text)' }}>{file.name}</p>
              <p className="text-xs" style={{ color: 'var(--nexus-muted)' }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button onClick={removeFile} className="hover:opacity-80" style={{ color: 'var(--nexus-muted)' }}>
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mention suggestions */}
      <AnimatePresence>
        {mentionSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-2 rounded-xl overflow-hidden shadow-xl"
            style={{ background: 'var(--nexus-elevated)', border: '1px solid var(--nexus-border)' }}
          >
            {mentionSuggestions.map(u => (
              <button
                key={u.id}
                onClick={() => insertMention(u.username)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors hover:bg-white/5"
                style={{ color: 'var(--nexus-text)' }}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  {u.pfpUrl ? (
                    <img src={u.pfpUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                         style={{ background: 'var(--nexus-accent)' }}>
                      {u.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="font-medium">{u.username}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="relative flex items-end gap-2 rounded-2xl px-3 py-2"
           style={{ background: 'var(--nexus-elevated)', border: '1px solid var(--nexus-border)' }}>
        {/* File upload */}
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
        <motion.button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--nexus-muted)' }}
          whileHover={{ color: 'var(--nexus-accent)', background: 'color-mix(in srgb, var(--nexus-accent) 10%, transparent)' }}
          whileTap={{ scale: 0.9 }}
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </motion.button>

        {/* Text area */}
        <textarea
          ref={inputRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={!activeChannel && !activeDM}
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none text-sm leading-6 max-h-32 overflow-y-auto"
          style={{ color: 'var(--nexus-text)' }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
          }}
        />

        {/* Emoji */}
        <div className="relative flex-shrink-0">
          <motion.button
            type="button"
            onClick={() => setShowEmoji(v => !v)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--nexus-muted)' }}
            whileHover={{ color: 'var(--nexus-accent)', background: 'color-mix(in srgb, var(--nexus-accent) 10%, transparent)' }}
            whileTap={{ scale: 0.9 }}
            title="Emoji"
          >
            <Smile className="w-5 h-5" />
          </motion.button>

          <AnimatePresence>
            {showEmoji && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-10 right-0 z-50"
              >
                <EmojiPicker onEmojiClick={insertEmoji} theme="dark" height={350} width={300} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Send */}
        <motion.button
          onClick={send}
          disabled={loading || (!content.trim() && !file)}
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: (content.trim() || file) ? 'var(--nexus-accent)' : 'var(--nexus-surface)',
            color: (content.trim() || file) ? 'white' : 'var(--nexus-muted)',
          }}
          whileHover={(content.trim() || file) ? { scale: 1.08 } : {}}
          whileTap={{ scale: 0.92 }}
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <Send className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
