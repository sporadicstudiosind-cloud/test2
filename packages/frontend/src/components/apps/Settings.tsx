import { useState } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { SystemSettings } from '../../types';
import { useNotificationStore } from '../../stores/notificationStore';
import { Palette, Monitor, User, Info } from 'lucide-react';

const WALLPAPERS = [
  { id: 'gradient-blue', label: 'Ocean Blue', preview: 'linear-gradient(135deg, #1e3a5f, #1e40af, #312e81)' },
  { id: 'gradient-purple', label: 'Purple Dream', preview: 'linear-gradient(135deg, #2d1b69, #7c3aed, #db2777)' },
  { id: 'gradient-green', label: 'Forest', preview: 'linear-gradient(135deg, #052e16, #166534, #15803d)' },
  { id: 'gradient-dark', label: 'Dark Space', preview: 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)' },
  { id: 'gradient-sunset', label: 'Sunset', preview: 'linear-gradient(135deg, #7c2d12, #b91c1c, #9333ea)' },
  { id: 'solid-dark', label: 'Solid Dark', preview: '#0f172a' },
  { id: 'solid-gray', label: 'Solid Gray', preview: '#1f2937' },
];

const ACCENT_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4', '#ffffff',
];

type Tab = 'appearance' | 'display' | 'account' | 'about';

export function Settings() {
  const { settings, saveSettings } = useThemeStore();
  const { user, config, logout } = useAuthStore();
  const { add: notify } = useNotificationStore();
  const [tab, setTab] = useState<Tab>('appearance');

  const update = async (patch: Partial<SystemSettings>) => {
    await saveSettings(patch);
    notify('success', 'Settings Saved', '');
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
    { id: 'display', label: 'Display', icon: <Monitor size={15} /> },
    { id: 'account', label: 'Account', icon: <User size={15} /> },
    { id: 'about', label: 'About', icon: <Info size={15} /> },
  ];

  return (
    <div className="w-full h-full flex bg-gray-950 text-white">
      {/* Sidebar */}
      <div className="w-44 shrink-0 bg-gray-900 border-r border-white/5 p-2">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-wider px-2 py-2">Settings</p>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              tab === t.id ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === 'appearance' && (
          <div className="space-y-8 max-w-xl">
            {/* Theme mode */}
            <section>
              <h2 className="text-white font-semibold mb-3">Theme</h2>
              <div className="flex gap-3">
                {(['light', 'dark'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => update({ theme: { ...settings.theme, mode } })}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors capitalize ${
                      settings.theme.mode === mode
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                        : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {mode === 'light' ? '☀️' : '🌙'} {mode}
                  </button>
                ))}
              </div>
            </section>

            {/* Accent color */}
            <section>
              <h2 className="text-white font-semibold mb-3">Accent Color</h2>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => update({ theme: { ...settings.theme, accentColor: color } })}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${
                      settings.theme.accentColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <label className="text-white/50 text-sm">Custom:</label>
                <input
                  type="color"
                  value={settings.theme.accentColor}
                  onChange={(e) => update({ theme: { ...settings.theme, accentColor: e.target.value } })}
                  className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-white/40 text-sm font-mono">{settings.theme.accentColor}</span>
              </div>
            </section>

            {/* Wallpaper */}
            <section>
              <h2 className="text-white font-semibold mb-3">Wallpaper</h2>
              <div className="grid grid-cols-4 gap-3">
                {WALLPAPERS.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => update({ wallpaper: wp.id })}
                    className={`aspect-video rounded-lg border-2 transition-all ${
                      settings.wallpaper === wp.id ? 'border-blue-400 scale-105' : 'border-transparent hover:border-white/20'
                    }`}
                    style={{ background: wp.preview }}
                    title={wp.label}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'display' && (
          <div className="space-y-6 max-w-xl">
            <h2 className="text-white font-semibold">Display Settings</h2>

            {/* Icon size */}
            <div>
              <label className="text-white/60 text-sm block mb-2">Desktop Icon Size</label>
              <div className="flex gap-3">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => update({ desktopIconSize: size })}
                    className={`flex-1 py-2 rounded-lg border text-sm capitalize transition-colors ${
                      settings.desktopIconSize === size
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                        : 'border-white/10 text-white/50 hover:bg-white/5'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Show seconds */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Show seconds in clock</p>
                <p className="text-white/40 text-xs">Display seconds in the taskbar clock</p>
              </div>
              <button
                onClick={() => update({ showSeconds: !settings.showSeconds })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.showSeconds ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.showSeconds ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {/* Desktop name */}
            <div>
              <label className="text-white/60 text-sm block mb-2">Desktop Name</label>
              <input
                type="text"
                value={settings.desktopName}
                onChange={(e) => update({ desktopName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        )}

        {tab === 'account' && (
          <div className="space-y-6 max-w-lg">
            <h2 className="text-white font-semibold">Account</h2>
            {user && (
              <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl border border-white/5">
                <img src={user.avatarUrl} alt={user.login} className="w-16 h-16 rounded-full border-2 border-blue-400/30" />
                <div>
                  <p className="text-white font-semibold">{user.name || user.login}</p>
                  <p className="text-white/50 text-sm">@{user.login}</p>
                  {user.bio && <p className="text-white/40 text-xs mt-1">{user.bio}</p>}
                </div>
              </div>
            )}
            {config && (
              <div className="p-4 bg-gray-900 rounded-xl border border-white/5 space-y-2">
                <p className="text-white/60 text-xs font-semibold uppercase">Storage Repository</p>
                <p className="text-white text-sm font-mono">{config.owner}/{config.repo}</p>
                <p className="text-white/40 text-xs">Branch: {config.branch}</p>
                <a
                  href={`https://github.com/${config.owner}/${config.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs transition-colors mt-1"
                >
                  View on GitHub →
                </a>
              </div>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}

        {tab === 'about' && (
          <div className="space-y-4 max-w-lg">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🖥️</div>
              <h2 className="text-white text-2xl font-bold">WebOS</h2>
              <p className="text-white/40 text-sm mt-1">Version 1.0.0</p>
            </div>
            <div className="space-y-2 p-4 bg-gray-900 rounded-xl border border-white/5 text-sm">
              {[
                ['Engine', 'React 18 + Vite'],
                ['Storage', 'GitHub Contents API'],
                ['Auth', 'Personal Access Token'],
                ['Styling', 'Tailwind CSS'],
                ['State', 'Zustand'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-white/40">{k}</span>
                  <span className="text-white/80">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-white/30 text-xs text-center">
              A browser-based desktop OS powered by the GitHub API
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
