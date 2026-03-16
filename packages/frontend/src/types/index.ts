export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
}

export interface Window {
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

export interface AppManifest {
  id: string;
  name: string;
  version: string;
  icon?: string;
  type: 'web' | 'desktop' | 'apk';
  entry: string;
}

export interface FileSystemNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: number;
  content?: string;
}
