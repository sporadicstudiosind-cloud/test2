import { useState, useRef, useCallback, useEffect } from 'react';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';
import { readJson, writeJson } from '../../services/githubApi';
import { Bookmark } from '../../types';
import { ArrowLeft, ArrowRight, RotateCw, X, Bookmark as BookmarkIcon, BookmarkCheck, Home, ExternalLink, Shield, AlertTriangle } from 'lucide-react';

interface Props {
  windowId?: string;
  appData?: Record<string, unknown>;
}

const QUICK_LINKS = [
  { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { name: 'MDN Docs', url: 'https://developer.mozilla.org', icon: '📚' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '💬' },
  { name: 'Wikipedia', url: 'https://en.m.wikipedia.org/wiki/Main_Page', icon: '📖' },
  { name: 'Reddit', url: 'https://old.reddit.com', icon: '🤖' },
  { name: 'HackerNews', url: 'https://news.ycombinator.com', icon: '🟠' },
];

const BOOKMARKS_PATH = '.osdata/bookmarks.json';

function normalizeUrl(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.includes('.') && !raw.includes(' ')) return `https://${raw}`;
  return `https://www.google.com/search?q=${encodeURIComponent(raw)}&igu=1`;
}

export function Browser({ appData }: Props) {
  const { add: notify } = useNotificationStore();
  const { config } = useAuthStore();

  const [inputUrl, setInputUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentUrl = history[histIdx] || '';

  // Load bookmarks
  useEffect(() => {
    if (!config) return;
    readJson<Bookmark[]>(config, BOOKMARKS_PATH).then((bm) => {
      if (bm) setBookmarks(bm);
    }).catch(() => {});
    const initial = appData?.url as string | undefined;
    if (initial) navigateTo(initial);
  }, []);

  const navigateTo = useCallback((url: string) => {
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    setBlocked(false);
    setIsLoading(true);
    setInputUrl(normalized);
    const newHistory = history.slice(0, histIdx + 1);
    newHistory.push(normalized);
    setHistory(newHistory);
    setHistIdx(newHistory.length - 1);
    setLoadedUrl(normalized);
  }, [history, histIdx]);

  const goBack = () => {
    if (histIdx > 0) { setHistIdx(histIdx - 1); setLoadedUrl(history[histIdx - 1]); setInputUrl(history[histIdx - 1]); }
  };
  const goForward = () => {
    if (histIdx < history.length - 1) { setHistIdx(histIdx + 1); setLoadedUrl(history[histIdx + 1]); setInputUrl(history[histIdx + 1]); }
  };

  const handleIframeLoad = () => setIsLoading(false);
  const handleIframeError = () => { setIsLoading(false); setBlocked(true); };

  const isBookmarked = bookmarks.some((b) => b.url === currentUrl);
  const toggleBookmark = async () => {
    if (!config) return;
    let updated: Bookmark[];
    if (isBookmarked) {
      updated = bookmarks.filter((b) => b.url !== currentUrl);
      notify('info', 'Bookmark Removed', currentUrl);
    } else {
      const newBm: Bookmark = { id: crypto.randomUUID(), title: currentUrl, url: currentUrl, createdAt: new Date().toISOString() };
      updated = [...bookmarks, newBm];
      notify('success', 'Bookmarked', currentUrl);
    }
    setBookmarks(updated);
    await writeJson(config, BOOKMARKS_PATH, updated, 'update: bookmarks').catch(() => {});
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 text-white">
      {/* Browser toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-900 border-b border-white/5 shrink-0">
        <button onClick={goBack} disabled={histIdx <= 0} className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors">
          <ArrowLeft size={15} />
        </button>
        <button onClick={goForward} disabled={histIdx >= history.length - 1} className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors">
          <ArrowRight size={15} />
        </button>
        <button
          onClick={() => { if (loadedUrl) { setIsLoading(true); setBlocked(false); setLoadedUrl(loadedUrl + '?_r=' + Date.now()); } }}
          disabled={!loadedUrl}
          className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors"
        >
          <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => { setInputUrl(''); setLoadedUrl(''); setHistory([]); setHistIdx(-1); }} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Home">
          <Home size={14} />
        </button>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1 bg-gray-800 border border-white/10 rounded-lg mx-1">
          {loadedUrl.startsWith('https://') ? (
            <Shield size={12} className="text-green-400 shrink-0" />
          ) : loadedUrl ? (
            <AlertTriangle size={12} className="text-yellow-400 shrink-0" />
          ) : null}
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') navigateTo(inputUrl); }}
            placeholder="Search or enter URL..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
          />
          {inputUrl && (
            <button onClick={() => setInputUrl('')} className="text-white/30 hover:text-white/60">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Bookmark toggle */}
        <button
          onClick={toggleBookmark}
          disabled={!currentUrl}
          className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors"
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          {isBookmarked ? <BookmarkCheck size={15} className="text-yellow-400" /> : <BookmarkIcon size={15} className="text-white/50" />}
        </button>
        <button
          onClick={() => setShowBookmarks((v) => !v)}
          className={`px-2 py-1 text-xs rounded transition-colors ${showBookmarks ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'}`}
        >
          Bookmarks
        </button>
        {currentUrl && (
          <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/50" title="Open in new tab">
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Bookmarks bar */}
      {showBookmarks && (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-800/60 border-b border-white/5 overflow-x-auto shrink-0">
          {bookmarks.length === 0 ? (
            <span className="text-white/30 text-xs">No bookmarks yet</span>
          ) : bookmarks.map((bm) => (
            <button
              key={bm.id}
              onClick={() => navigateTo(bm.url)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-md text-xs text-white/80 whitespace-nowrap transition-colors"
            >
              <BookmarkIcon size={11} className="text-yellow-400" />
              {bm.title}
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      {!loadedUrl ? (
        // New Tab page
        <div className="flex-1 bg-gray-950 overflow-auto flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🌐</div>
              <h2 className="text-white text-xl font-semibold mb-1">WebOS Browser</h2>
              <p className="text-white/40 text-sm">Enter a URL or search term above to browse the web</p>
            </div>

            {/* Quick search */}
            <form
              onSubmit={(e) => { e.preventDefault(); navigateTo(inputUrl); }}
              className="flex gap-2 mb-8"
            >
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Search Google or enter URL..."
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-400 text-sm"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm transition-colors"
              >
                Go
              </button>
            </form>

            {/* Quick links */}
            <div className="grid grid-cols-3 gap-3">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.url}
                  onClick={() => navigateTo(link.url)}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-800/60 hover:bg-gray-700/60 border border-white/5 rounded-xl transition-colors"
                >
                  <span className="text-2xl">{link.icon}</span>
                  <span className="text-white/70 text-xs font-medium">{link.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : blocked ? (
        // Blocked by X-Frame-Options
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 p-8 text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h3 className="text-white text-lg font-semibold mb-2">Can't display this site</h3>
          <p className="text-white/50 text-sm mb-1">
            <code className="bg-white/10 px-1 rounded">{currentUrl}</code>
          </p>
          <p className="text-white/40 text-sm mb-6">This site blocks embedding in iframes (X-Frame-Options).</p>
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm transition-colors"
          >
            <ExternalLink size={14} /> Open in new tab
          </a>
        </div>
      ) : (
        // iframe
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
              <div className="text-center text-white/40">
                <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Loading {loadedUrl}</p>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={loadedUrl}
            className="w-full h-full border-0 bg-white"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="Browser"
          />
        </div>
      )}
    </div>
  );
}
