// ──────────────────────────────────────────
// Auth & GitHub Config
// ──────────────────────────────────────────
export interface User {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
  bio: string | null;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

// ──────────────────────────────────────────
// Window Management
// ──────────────────────────────────────────
export interface AppWindow {
  id: string;
  title: string;
  appId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  appData?: Record<string, unknown>;
}

// ──────────────────────────────────────────
// File System
// ──────────────────────────────────────────
export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  sha?: string;
  content?: string;
  mimeType?: string;
}

// ──────────────────────────────────────────
// App Manifest
// ──────────────────────────────────────────
export type AppType = 'builtin' | 'web' | 'react' | 'apk';
export type AppCategory = 'system' | 'productivity' | 'browser' | 'media' | 'games' | 'utilities';

export interface AppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  type: AppType;
  entry: string;
  permissions: string[];
  category: AppCategory;
  author?: string;
  screenshots?: string[];
  installedAt?: string;
}

// ──────────────────────────────────────────
// Settings & Theme
// ──────────────────────────────────────────
export interface ThemeConfig {
  mode: 'light' | 'dark';
  accentColor: string;
}

export interface SystemSettings {
  theme: ThemeConfig;
  wallpaper: string;
  desktopIconSize: 'small' | 'medium' | 'large';
  taskbarPosition: 'bottom' | 'top';
  showSeconds: boolean;
  desktopName: string;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  theme: { mode: 'dark', accentColor: '#3b82f6' },
  wallpaper: 'gradient-blue',
  desktopIconSize: 'medium',
  taskbarPosition: 'bottom',
  showSeconds: true,
  desktopName: 'My Desktop',
};

// ──────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────
export type NotificationType = 'info' | 'success' | 'error' | 'warning';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
}

// ──────────────────────────────────────────
// Browser Bookmarks
// ──────────────────────────────────────────
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  createdAt: string;
}

// ──────────────────────────────────────────
// Context Menu
// ──────────────────────────────────────────
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  divider?: boolean;
  disabled?: boolean;
}
