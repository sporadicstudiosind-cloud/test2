import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useWindowStore } from '../stores/windowStore';
import { useThemeStore } from '../stores/themeStore';
import { useNotificationStore } from '../stores/notificationStore';
import { BUILTIN_APPS } from '../stores/appStore';
import { Power, Bell, Search } from 'lucide-react';

export function Taskbar() {
  const { user, logout } = useAuthStore();
  const { windows, createWindow, focusWindow, restoreWindow } = useWindowStore();
  const { settings } = useThemeStore();
  const { notifications } = useNotificationStore();
  const [time, setTime] = useState(new Date());
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [search, setSearch] = useState('');
  const startMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Close start menu on outside click
  useEffect(() => {
    if (!showStartMenu) return;
    const handle = (e: MouseEvent) => {
      if (startMenuRef.current && !startMenuRef.current.contains(e.target as Node)) {
        setShowStartMenu(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showStartMenu]);

  const timeStr = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: settings.showSeconds ? '2-digit' : undefined,
  });
  const dateStr = time.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const filteredApps = BUILTIN_APPS.filter((a) =>
    search === '' || a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleWindowClick = (w: typeof windows[0]) => {
    if (w.isMinimized) {
      restoreWindow(w.id);
      focusWindow(w.id);
    } else {
      focusWindow(w.id);
    }
  };

  return (
    <div
      className="h-11 flex items-center px-2 gap-1 select-none z-[9990] relative"
      style={{ background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Start Button */}
      <div ref={startMenuRef} className="relative">
        <button
          onClick={() => setShowStartMenu((v) => !v)}
          className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-1.5 ${
            showStartMenu ? 'bg-blue-500 text-white' : 'hover:bg-white/10 text-white'
          }`}
        >
          🖥️ Start
        </button>

        {showStartMenu && (
          <div className="absolute bottom-12 left-0 w-72 bg-gray-900/98 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* User header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
              <img
                src={user?.avatarUrl}
                alt={user?.login}
                className="w-10 h-10 rounded-full border-2 border-blue-400/50"
              />
              <div>
                <p className="text-white font-semibold text-sm">{user?.name || user?.login}</p>
                <p className="text-white/40 text-xs">@{user?.login}</p>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                <Search size={14} className="text-white/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search apps..."
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* App list */}
            <div className="px-2 pb-2 max-h-64 overflow-y-auto">
              {filteredApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => { createWindow(app.name, app.id); setShowStartMenu(false); setSearch(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/8 rounded-xl text-left transition-colors"
                >
                  <span className="text-2xl">{app.icon}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{app.name}</p>
                    <p className="text-white/40 text-xs">{app.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10 flex justify-between items-center">
              <span className="text-white/40 text-xs">WebOS</span>
              <button
                onClick={() => { logout(); setShowStartMenu(false); }}
                className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                <Power size={14} /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Open windows */}
      <div className="flex-1 flex gap-1 overflow-x-auto px-1">
        {windows.map((win) => (
          <button
            key={win.id}
            onClick={() => handleWindowClick(win)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors max-w-36 truncate ${
              win.isMinimized
                ? 'bg-white/5 text-white/50 border border-white/10'
                : 'bg-blue-600/40 hover:bg-blue-600/60 text-white border border-blue-500/30'
            }`}
            title={win.title}
          >
            {win.title}
          </button>
        ))}
      </div>

      {/* System tray */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Notifications */}
        <button
          onClick={() => {}}
          className="relative p-2 hover:bg-white/10 rounded-md transition-colors text-white/60 hover:text-white"
        >
          <Bell size={15} />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full" />
          )}
        </button>

        {/* Clock */}
        <div className="px-3 py-1 text-right">
          <p className="text-white text-xs font-mono leading-tight">{timeStr}</p>
          <p className="text-white/40 text-xs leading-tight">{dateStr}</p>
        </div>

        {/* Avatar */}
        {user?.avatarUrl && (
          <img
            src={user.avatarUrl}
            alt={user.login}
            className="w-7 h-7 rounded-full border border-white/20 cursor-pointer"
            title={user.login}
          />
        )}
      </div>
    </div>
  );
}
