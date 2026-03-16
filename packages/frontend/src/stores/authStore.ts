import { create } from 'zustand';
import { User, GitHubConfig } from '../types';
import { getAuthenticatedUser, getRepo, createRepo, initializeOsData } from '../services/githubApi';

const STORAGE_KEY = 'gh_os_config';

interface AuthStore {
  user: User | null;
  config: GitHubConfig | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  checkAuth: () => Promise<void>;
  login: (token: string, owner: string, repo: string, createIfMissing?: boolean) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
}

function loadStoredConfig(): GitHubConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  config: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    const stored = loadStoredConfig();
    if (!stored) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const ghUser = await getAuthenticatedUser(stored.token);
      const user: User = {
        id: ghUser.id,
        login: ghUser.login,
        name: ghUser.name,
        email: ghUser.email,
        avatarUrl: ghUser.avatar_url,
        bio: ghUser.bio,
      };
      set({ user, config: stored, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  login: async (token, owner, repo, createIfMissing = false) => {
    set({ isLoading: true, error: null });
    try {
      const ghUser = await getAuthenticatedUser(token);
      const user: User = {
        id: ghUser.id,
        login: ghUser.login,
        name: ghUser.name,
        email: ghUser.email,
        avatarUrl: ghUser.avatar_url,
        bio: ghUser.bio,
      };

      const config: GitHubConfig = { token, owner, repo, branch: 'main' };

      const repoData = await getRepo(config);
      if (!repoData) {
        if (!createIfMissing) {
          throw new Error(`Repo "${owner}/${repo}" not found. Enable "Create if missing" to create it.`);
        }
        await createRepo(token, repo);
      }

      await initializeOsData(config);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      set({ user, config, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, config: null, isAuthenticated: false, error: null });
  },

  setError: (error) => set({ error }),
}));
