import { create } from 'zustand';
import { AppManifest } from '../types';
import { useAuthStore } from './authStore';
import { readJson, writeJson } from '../services/githubApi';

const APPS_PATH = '.osdata/apps/installed.json';

// Built-in apps always available (not stored in GitHub)
export const BUILTIN_APPS: AppManifest[] = [
  {
    id: 'file-explorer',
    name: 'File Explorer',
    version: '1.0.0',
    description: 'Browse and manage your files stored in GitHub',
    icon: '📁',
    type: 'builtin',
    entry: '',
    permissions: ['filesystem'],
    category: 'system',
  },
  {
    id: 'text-editor',
    name: 'Text Editor',
    version: '1.0.0',
    description: 'Edit text files with syntax highlighting',
    icon: '📝',
    type: 'builtin',
    entry: '',
    permissions: ['filesystem'],
    category: 'productivity',
  },
  {
    id: 'browser',
    name: 'Web Browser',
    version: '1.0.0',
    description: 'Browse the web with inline rendering',
    icon: '🌐',
    type: 'builtin',
    entry: '',
    permissions: [],
    category: 'browser',
  },
  {
    id: 'app-store',
    name: 'App Store',
    version: '1.0.0',
    description: 'Install and manage apps',
    icon: '🏪',
    type: 'builtin',
    entry: '',
    permissions: [],
    category: 'system',
  },
  {
    id: 'settings',
    name: 'Settings',
    version: '1.0.0',
    description: 'Customize your desktop experience',
    icon: '⚙️',
    type: 'builtin',
    entry: '',
    permissions: [],
    category: 'system',
  },
];

// Curated app registry (installable apps)
export const APP_REGISTRY: AppManifest[] = [
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    version: '1.0.0',
    description: 'The free encyclopedia',
    icon: '📖',
    type: 'web',
    entry: 'https://en.wikipedia.org/wiki/Main_Page',
    permissions: [],
    category: 'browser',
    author: 'Wikimedia Foundation',
  },
  {
    id: 'calculator-app',
    name: 'Calculator',
    version: '1.0.0',
    description: 'Simple online calculator',
    icon: '🧮',
    type: 'web',
    entry: 'https://www.desmos.com/scientific',
    permissions: [],
    category: 'utilities',
    author: 'Desmos',
  },
  {
    id: 'openstreetmap',
    name: 'Maps',
    version: '1.0.0',
    description: 'Interactive world map',
    icon: '🗺️',
    type: 'web',
    entry: 'https://www.openstreetmap.org/export/embed.html',
    permissions: [],
    category: 'utilities',
    author: 'OpenStreetMap',
  },
  {
    id: 'draw-io',
    name: 'Diagrams',
    version: '1.0.0',
    description: 'Create flowcharts and diagrams',
    icon: '📊',
    type: 'web',
    entry: 'https://app.diagrams.net/?embed=1&ui=min',
    permissions: [],
    category: 'productivity',
    author: 'diagrams.net',
  },
  {
    id: 'excalidraw',
    name: 'Excalidraw',
    version: '1.0.0',
    description: 'Collaborative whiteboard tool',
    icon: '✏️',
    type: 'web',
    entry: 'https://excalidraw.com/',
    permissions: [],
    category: 'productivity',
    author: 'Excalidraw',
  },
  {
    id: 'squoosh',
    name: 'Image Editor',
    version: '1.0.0',
    description: 'Compress and convert images',
    icon: '🖼️',
    type: 'web',
    entry: 'https://squoosh.app/',
    permissions: [],
    category: 'media',
    author: 'Google',
  },
];

interface AppStore {
  installedApps: AppManifest[];
  isLoading: boolean;
  error: string | null;

  loadInstalledApps: () => Promise<void>;
  installApp: (manifest: AppManifest) => Promise<void>;
  uninstallApp: (appId: string) => Promise<void>;
  isInstalled: (appId: string) => boolean;
  getAllApps: () => AppManifest[];
}

export const useAppStore = create<AppStore>((set, get) => ({
  installedApps: [],
  isLoading: false,
  error: null,

  loadInstalledApps: async () => {
    const config = useAuthStore.getState().config;
    if (!config) return;
    try {
      set({ isLoading: true });
      const apps = await readJson<AppManifest[]>(config, APPS_PATH);
      set({ installedApps: apps || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  installApp: async (manifest) => {
    const config = useAuthStore.getState().config;
    if (!config) return;
    const updated = [...get().installedApps, { ...manifest, installedAt: new Date().toISOString() }];
    set({ installedApps: updated });
    await writeJson(config, APPS_PATH, updated, `install: ${manifest.name}`).catch(() => {});
  },

  uninstallApp: async (appId) => {
    const config = useAuthStore.getState().config;
    if (!config) return;
    const updated = get().installedApps.filter((a) => a.id !== appId);
    set({ installedApps: updated });
    await writeJson(config, APPS_PATH, updated, `uninstall: ${appId}`).catch(() => {});
  },

  isInstalled: (appId) => get().installedApps.some((a) => a.id === appId),

  getAllApps: () => [...BUILTIN_APPS, ...get().installedApps],
}));
