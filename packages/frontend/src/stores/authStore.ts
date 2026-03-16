import { create } from 'zustand';
import { User } from '../types/index';
import axios from 'axios';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  checkAuth: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const response = await axios.get('/api/auth/me');

      if (response.data.authenticated) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to check authentication',
      });
    }
  },

  login: () => {
    window.location.href = '/api/auth/login';
  },

  logout: async () => {
    try {
      await axios.post('/api/auth/logout');
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      set({ error: 'Failed to logout' });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
