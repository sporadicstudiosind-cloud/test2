import { create } from 'zustand';
import { SystemSettings, ThemeConfig, DEFAULT_SETTINGS } from '../types';
import { useAuthStore } from './authStore';
import { readJson, writeJson } from '../services/githubApi';

const LOCAL_KEY = 'os_settings';
const SETTINGS_PATH = '.osdata/settings.json';

interface ThemeStore {
  settings: SystemSettings;
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  saveSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  setTheme: (theme: ThemeConfig) => void;
  applyTheme: () => void;
}

function loadLocal(): SystemSettings {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  settings: loadLocal(),
  isLoading: false,

  loadSettings: async () => {
    const config = useAuthStore.getState().config;
    if (!config) return;
    try {
      set({ isLoading: true });
      const remote = await readJson<SystemSettings>(config, SETTINGS_PATH);
      if (remote) {
        const merged = { ...DEFAULT_SETTINGS, ...remote };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
        set({ settings: merged });
        get().applyTheme();
      }
    } catch {}
    set({ isLoading: false });
  },

  saveSettings: async (updates) => {
    const next = { ...get().settings, ...updates };
    set({ settings: next });
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    get().applyTheme();

    const config = useAuthStore.getState().config;
    if (config) {
      await writeJson(config, SETTINGS_PATH, next, 'update: settings').catch(() => {});
    }
  },

  setTheme: (theme) => {
    const next = { ...get().settings, theme };
    set({ settings: next });
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    get().applyTheme();
  },

  applyTheme: () => {
    const { theme } = get().settings;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme.mode);
    root.style.setProperty('--accent', theme.accentColor);
    // Derive lighter/darker variants
    root.style.setProperty('--accent-hover', theme.accentColor + 'dd');
  },
}));
