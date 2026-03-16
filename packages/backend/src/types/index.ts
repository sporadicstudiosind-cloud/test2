export interface User {
  id: string;
  githubId: number;
  username: string;
  email: string;
  avatarUrl: string;
  accessToken: string;
  repoUrl: string;
}

export interface AppManifest {
  id: string;
  name: string;
  version: string;
  icon?: string;
  type: 'web' | 'desktop' | 'apk';
  entry: string; // path or URL to entry point
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface WindowState {
  id: string;
  title: string;
  appId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
}

export interface FileSystemNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: number;
  content?: string;
}

export interface GitCommitMessage {
  title: string;
  body?: string;
  timestamp: number;
}
