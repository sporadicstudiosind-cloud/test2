import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Hash, MessageSquare, User, Filter } from 'lucide-react';
import { useStore } from '../../store';
import { searchApi } from '../../api';
import { formatDistanceToNow } from 'date-fns';

export default function SearchModal() {
  const { toggleSearch, setActiveChannel, channels } = useStore();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ hasLink: false, from: '' });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e) => { if (e.key === 'Escape') toggleSearch(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) { setResults(null); return; }
    timer.current = setTimeout(doSearch, 400);
  }, [query, filters]);

  const doSearch = async () => {
    setLoading(true);
    try {
      const res = await searchApi.search({
        q: query,
        ...(filters.hasLink ? { hasLink: true } : {}),
        ...(filters.from ? { from: filters.from } : {}),
      });
      setResults(res.data);
    } catch {}
    setLoading(false);
  };

  const goToChannel = (channelId) => {
    const ch = channels.find(c => c.id === channelId);
    if (ch) { setActiveChannel(ch); toggleSearch(); }
  };

  const totalResults = results
    ? results.channelMessages.length + results.dmMessages.length + results.users.length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
         style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
         onClick={toggleSearch}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--nexus-surface)', border: '1px solid var(--nexus-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3"
             style={{ borderBottom: '1px solid var(--nexus-border)' }}>
          <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--nexus-accent)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search messages, users..."
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: 'var(--nexus-text)' }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: showFilters ? 'var(--nexus-accent)' : 'var(--nexus-muted)', background: showFilters ? 'color-mix(in srgb, var(--nexus-accent) 10%, transparent)' : 'transparent' }}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button onClick={toggleSearch} className="p-1.5 rounded-lg hover:opacity-70"
                    style={{ color: 'var(--nexus-muted)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-4 px-4 py-3 text-sm"
                   style={{ borderBottom: '1px solid var(--nexus-border)', background: 'var(--nexus-elevated)' }}>
                <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--nexus-muted)' }}>
                  <input type="checkbox" checked={filters.hasLink}
                         onChange={e => setFilters(f => ({ ...f, hasLink: e.target.checked }))}
                         className="rounded" />
                  has:link
                </label>
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--nexus-muted)' }}>from:</span>
                  <input
                    value={filters.from}
                    onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                    placeholder="username"
                    className="nexus-input text-sm py-1 px-2 w-32"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 animate-spin"
                   style={{ borderColor: 'var(--nexus-accent)', borderTopColor: 'transparent' }} />
            </div>
          )}

          {!loading && query && results && totalResults === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--nexus-muted)' }}>
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No results for "{query}"</p>
            </div>
          )}

          {!loading && results && (
            <div className="py-2">
              {/* Users */}
              {results.users.length > 0 && (
                <Section title="Users">
                  {results.users.map(u => (
                    <ResultItem key={u.id} icon={<User className="w-4 h-4" />}
                                title={u.username} subtitle={u.bio || 'No bio'} />
                  ))}
                </Section>
              )}

              {/* Channel Messages */}
              {results.channelMessages.length > 0 && (
                <Section title="Channel Messages">
                  {results.channelMessages.map(m => (
                    <ResultItem
                      key={m.id}
                      icon={<Hash className="w-4 h-4" />}
                      title={`#${m.channel?.name} — ${m.user?.username}`}
                      subtitle={m.content}
                      timestamp={m.createdAt}
                      onClick={() => goToChannel(m.channelId)}
                    />
                  ))}
                </Section>
              )}

              {/* DMs */}
              {results.dmMessages.length > 0 && (
                <Section title="Direct Messages">
                  {results.dmMessages.map(m => (
                    <ResultItem
                      key={m.id}
                      icon={<MessageSquare className="w-4 h-4" />}
                      title={m.sender?.username}
                      subtitle={m.content}
                      timestamp={m.createdAt}
                    />
                  ))}
                </Section>
              )}
            </div>
          )}

          {!query && (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: 'var(--nexus-muted)' }}>
                Type to search messages and users
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--nexus-muted)', opacity: 0.6 }}>
                Try: <code className="px-1 py-0.5 rounded" style={{ background: 'var(--nexus-elevated)' }}>has:link</code>
                {' '}· <code className="px-1 py-0.5 rounded" style={{ background: 'var(--nexus-elevated)' }}>from:username</code>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 flex items-center justify-between text-xs"
             style={{ borderTop: '1px solid var(--nexus-border)', color: 'var(--nexus-muted)' }}>
          <span>Press Esc to close</span>
          {results && <span>{totalResults} results</span>}
        </div>
      </motion.div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
         style={{ color: 'var(--nexus-muted)' }}>{title}</p>
      {children}
    </div>
  );
}

function ResultItem({ icon, title, subtitle, timestamp, onClick }) {
  return (
    <motion.div
      className="flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors"
      style={{ color: 'var(--nexus-text)' }}
      whileHover={{ background: 'var(--nexus-elevated)' }}
      onClick={onClick}
    >
      <div className="mt-0.5 flex-shrink-0" style={{ color: 'var(--nexus-accent)' }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--nexus-muted)' }}>{subtitle}</p>
      </div>
      {timestamp && (
        <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: 'var(--nexus-muted)' }}>
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
      )}
    </motion.div>
  );
}
