import { useState } from 'react';
import { useAppStore, APP_REGISTRY, BUILTIN_APPS } from '../../stores/appStore';
import { useWindowStore } from '../../stores/windowStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { AppManifest, AppCategory } from '../../types';
import { Download, Trash2, Search, CheckCircle } from 'lucide-react';

const CATEGORIES: { id: AppCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Apps', icon: '🏪' },
  { id: 'productivity', label: 'Productivity', icon: '📊' },
  { id: 'browser', label: 'Browsers', icon: '🌐' },
  { id: 'media', label: 'Media', icon: '🎨' },
  { id: 'utilities', label: 'Utilities', icon: '🔧' },
  { id: 'games', label: 'Games', icon: '🎮' },
];

export function AppStore() {
  const { installedApps, installApp, uninstallApp, isInstalled } = useAppStore();
  const { createWindow } = useWindowStore();
  const { add: notify } = useNotificationStore();

  const [tab, setTab] = useState<'store' | 'installed' | 'custom'>('store');
  const [category, setCategory] = useState<AppCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);
  const [customForm, setCustomForm] = useState<Partial<AppManifest>>({
    type: 'web',
    category: 'utilities',
  });

  const filteredRegistry = APP_REGISTRY.filter((app) => {
    const matchesCat = category === 'all' || app.category === category;
    const matchesSearch = search === '' || app.name.toLowerCase().includes(search.toLowerCase()) || app.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleInstall = async (app: AppManifest) => {
    setInstalling(app.id);
    await installApp(app);
    notify('success', 'App Installed', `${app.name} is ready to use`);
    setInstalling(null);
  };

  const handleUninstall = async (app: AppManifest) => {
    await uninstallApp(app.id);
    notify('info', 'App Removed', app.name);
  };

  const handleInstallCustom = async () => {
    if (!customForm.name || !customForm.entry) {
      notify('error', 'Missing fields', 'Name and URL are required');
      return;
    }
    const manifest: AppManifest = {
      id: customForm.id || customForm.name!.toLowerCase().replace(/\s+/g, '-'),
      name: customForm.name!,
      version: customForm.version || '1.0.0',
      description: customForm.description || '',
      icon: customForm.icon || '🔲',
      type: customForm.type || 'web',
      entry: customForm.entry!,
      permissions: [],
      category: customForm.category || 'utilities',
      author: customForm.author,
    };
    await installApp(manifest);
    notify('success', 'Custom App Added', manifest.name);
    setCustomForm({ type: 'web', category: 'utilities' });
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 text-white">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-900 border-b border-white/5 shrink-0">
        <h1 className="text-xl font-bold text-white mb-1">🏪 App Store</h1>
        <p className="text-white/40 text-sm">Install web apps and tools to your desktop</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 shrink-0">
        {(['store', 'installed', 'custom'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-blue-500 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {t === 'installed' ? `Installed (${installedApps.length})` : t === 'custom' ? 'Add Custom' : 'Discover'}
          </button>
        ))}
      </div>

      {tab === 'store' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Search + filter */}
          <div className="px-4 py-3 flex gap-3 shrink-0">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-800 border border-white/10 rounded-lg">
              <Search size={14} className="text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search apps..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto shrink-0">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  category === c.id ? 'bg-blue-500 text-white' : 'bg-gray-800 text-white/60 hover:bg-gray-700'
                }`}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {/* App grid */}
          <div className="flex-1 overflow-auto px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              {filteredRegistry.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  installed={isInstalled(app.id)}
                  installing={installing === app.id}
                  onInstall={() => handleInstall(app)}
                  onUninstall={() => handleUninstall(app)}
                  onOpen={() => createWindow(app.name, app.id)}
                />
              ))}
            </div>
            {filteredRegistry.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-white/30">
                <span className="text-4xl mb-3">🔍</span>
                <p>No apps found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'installed' && (
        <div className="flex-1 overflow-auto px-4 py-4">
          <div className="mb-3">
            <p className="text-white/40 text-xs">Built-in apps are always available and cannot be removed.</p>
          </div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Built-in</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {BUILTIN_APPS.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                installed
                installing={false}
                builtin
                onOpen={() => createWindow(app.name, app.id)}
                onInstall={() => {}}
                onUninstall={() => {}}
              />
            ))}
          </div>
          {installedApps.length > 0 && (
            <>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Installed</p>
              <div className="grid grid-cols-2 gap-3">
                {installedApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    installed
                    installing={false}
                    onInstall={() => {}}
                    onUninstall={() => handleUninstall(app)}
                    onOpen={() => createWindow(app.name, app.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'custom' && (
        <div className="flex-1 overflow-auto px-6 py-4">
          <p className="text-white/50 text-sm mb-6">Add any web app or URL as a desktop app. Web apps run in a sandboxed iframe.</p>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1">App Name *</label>
              <input
                type="text"
                value={customForm.name || ''}
                onChange={(e) => setCustomForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="My App"
                className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1">URL / Entry Point *</label>
              <input
                type="text"
                value={customForm.entry || ''}
                onChange={(e) => setCustomForm((f) => ({ ...f, entry: e.target.value }))}
                placeholder="https://example.com"
                className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1">Icon (emoji)</label>
                <input
                  type="text"
                  value={customForm.icon || ''}
                  onChange={(e) => setCustomForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="🔲"
                  className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1">Type</label>
                <select
                  value={customForm.type}
                  onChange={(e) => setCustomForm((f) => ({ ...f, type: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
                >
                  <option value="web">Web App (iframe)</option>
                  <option value="react">React Component</option>
                  <option value="apk">APK (Android)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1">Description</label>
              <input
                type="text"
                value={customForm.description || ''}
                onChange={(e) => setCustomForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description..."
                className="w-full px-3 py-2 bg-gray-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <button
              onClick={handleInstallCustom}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add App
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface AppCardProps {
  app: AppManifest;
  installed: boolean;
  installing: boolean;
  builtin?: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onOpen: () => void;
}

function AppCard({ app, installed, installing, builtin, onInstall, onUninstall, onOpen }: AppCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-900 hover:bg-gray-800/80 border border-white/5 rounded-xl transition-colors">
      <span className="text-3xl shrink-0">{app.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-white font-semibold text-sm truncate">{app.name}</p>
          {installed && !builtin && <CheckCircle size={12} className="text-green-400 shrink-0" />}
        </div>
        <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{app.description}</p>
        {app.author && <p className="text-white/25 text-xs mt-1">{app.author}</p>}
        <div className="flex gap-2 mt-3">
          {installed ? (
            <>
              <button
                onClick={onOpen}
                className="flex-1 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded-lg transition-colors font-medium"
              >
                Open
              </button>
              {!builtin && (
                <button
                  onClick={onUninstall}
                  className="py-1.5 px-2.5 hover:bg-red-500/20 text-white/40 hover:text-red-400 text-xs rounded-lg transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onInstall}
              disabled={installing}
              className="flex-1 py-1.5 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/40 text-white text-xs rounded-lg transition-colors font-medium flex items-center justify-center gap-1"
            >
              {installing ? (
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Download size={11} /> Install</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
