import { create } from 'zustand';
import { FileNode, GitHubConfig } from '../types';
import {
  listContents,
  readFile as ghReadFile,
  writeFile as ghWriteFile,
  deleteFile as ghDeleteFile,
  getFileSha,
  FS_ROOT,
} from '../services/githubApi';
import { useAuthStore } from './authStore';

function getConfig(): GitHubConfig {
  const config = useAuthStore.getState().config;
  if (!config) throw new Error('Not authenticated');
  return config;
}

// Map user-facing paths like "/Documents/foo.txt" to GitHub paths ".osdata/fs/Documents/foo.txt"
function toGhPath(path: string): string {
  const clean = path.replace(/^\/+/, '');
  return clean ? `${FS_ROOT}/${clean}` : FS_ROOT;
}

interface FileStore {
  currentPath: string;
  files: FileNode[];
  isLoading: boolean;
  error: string | null;

  listFiles: (path: string) => Promise<void>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  createFolder: (folderPath: string) => Promise<void>;
  deleteItem: (filePath: string) => Promise<void>;
  renameItem: (oldPath: string, newName: string) => Promise<void>;
  setCurrentPath: (path: string) => void;
  setError: (error: string | null) => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
  currentPath: '/',
  files: [],
  isLoading: false,
  error: null,

  listFiles: async (path: string) => {
    try {
      set({ isLoading: true, error: null });
      const config = getConfig();
      const ghPath = toGhPath(path);
      const nodes = await listContents(config, ghPath);
      // Convert GitHub paths back to user-facing paths
      const files: FileNode[] = nodes.map((n) => ({
        ...n,
        path: '/' + n.path.replace(`${FS_ROOT}/`, '').replace(`${FS_ROOT}`, ''),
        name: n.name,
      }));
      set({ currentPath: path, files, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to list files', isLoading: false });
    }
  },

  readFile: async (filePath: string) => {
    const config = getConfig();
    const { content } = await ghReadFile(config, toGhPath(filePath));
    return content;
  },

  writeFile: async (filePath: string, content: string) => {
    try {
      const config = getConfig();
      const ghPath = toGhPath(filePath);
      const sha = await getFileSha(config, ghPath);
      await ghWriteFile(config, ghPath, content, `update: ${filePath}`, sha || undefined);
      // Refresh if in same directory
      const dir = '/' + filePath.split('/').slice(1, -1).join('/');
      if (dir === get().currentPath || get().currentPath === '/') {
        await get().listFiles(get().currentPath);
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to write file' });
      throw err;
    }
  },

  createFolder: async (folderPath: string) => {
    try {
      const config = getConfig();
      const keepFile = `${toGhPath(folderPath)}/.gitkeep`;
      await ghWriteFile(config, keepFile, '', `mkdir: ${folderPath}`);
      await get().listFiles(get().currentPath);
    } catch (err: any) {
      set({ error: err.message || 'Failed to create folder' });
    }
  },

  deleteItem: async (filePath: string) => {
    try {
      const config = getConfig();
      const ghPath = toGhPath(filePath);
      const sha = await getFileSha(config, ghPath);
      if (!sha) throw new Error('File not found');
      await ghDeleteFile(config, ghPath, sha, `delete: ${filePath}`);
      await get().listFiles(get().currentPath);
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete item' });
    }
  },

  renameItem: async (oldPath: string, newName: string) => {
    try {
      // GitHub doesn't have rename - read + write to new path + delete old
      const config = getConfig();
      const parts = oldPath.split('/');
      parts[parts.length - 1] = newName;
      const newPath = parts.join('/');

      const { content, sha: oldSha } = await ghReadFile(config, toGhPath(oldPath));
      await ghWriteFile(config, toGhPath(newPath), content, `rename: ${oldPath} -> ${newPath}`);
      await ghDeleteFile(config, toGhPath(oldPath), oldSha, `rename (cleanup): ${oldPath}`);
      await get().listFiles(get().currentPath);
    } catch (err: any) {
      set({ error: err.message || 'Failed to rename item' });
    }
  },

  setCurrentPath: (path) => set({ currentPath: path }),
  setError: (error) => set({ error }),
}));
