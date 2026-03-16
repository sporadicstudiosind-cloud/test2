import { create } from 'zustand';
import { FileSystemNode } from '../types/index';
import axios from 'axios';

interface FileStore {
  currentPath: string;
  files: FileSystemNode[];
  isLoading: boolean;
  error: string | null;

  // Actions
  listFiles: (path: string) => Promise<void>;
  createFile: (filePath: string, content?: string) => Promise<void>;
  readFile: (filePath: string) => Promise<FileSystemNode>;
  deleteFile: (filePath: string) => Promise<void>;
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
      const response = await axios.get('/api/files/list', {
        params: { path: path || '/' },
      });

      set({
        currentPath: path,
        files: response.data.files || [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to list files',
        isLoading: false,
      });
    }
  },

  createFile: async (filePath: string, content?: string) => {
    try {
      set({ isLoading: true, error: null });
      await axios.post('/api/files/create', {
        path: filePath,
        content: content || '',
      });

      // Refresh current directory
      await get().listFiles(get().currentPath);
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to create file',
        isLoading: false,
      });
    }
  },

  readFile: async (filePath: string) => {
    try {
      const response = await axios.get('/api/files/read', {
        params: { path: filePath },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to read file');
    }
  },

  deleteFile: async (filePath: string) => {
    try {
      set({ isLoading: true, error: null });
      await axios.post('/api/files/delete', { path: filePath });

      // Refresh current directory
      await get().listFiles(get().currentPath);
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to delete file',
        isLoading: false,
      });
    }
  },

  setCurrentPath: (path: string) => {
    set({ currentPath: path });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
