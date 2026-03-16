import { create } from 'zustand';
import { AppWindow } from '../types';

function uid(): string {
  return crypto.randomUUID();
}

// Stagger new windows so they don't all stack on top of each other
let spawnOffset = 0;

interface WindowStore {
  windows: AppWindow[];
  focusedWindowId: string | null;
  nextZIndex: number;

  createWindow: (title: string, appId: string, appData?: Record<string, unknown>) => AppWindow;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  updateAppData: (id: string, data: Record<string, unknown>) => void;
  getWindowById: (id: string) => AppWindow | undefined;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  focusedWindowId: null,
  nextZIndex: 100,

  createWindow: (title, appId, appData) => {
    spawnOffset = (spawnOffset + 1) % 8;
    const offset = spawnOffset * 30;
    const newWindow: AppWindow = {
      id: uid(),
      title,
      appId,
      x: 60 + offset,
      y: 40 + offset,
      width: 900,
      height: 620,
      zIndex: get().nextZIndex,
      isMinimized: false,
      isMaximized: false,
      appData,
    };
    set((state) => ({
      windows: [...state.windows, newWindow],
      nextZIndex: state.nextZIndex + 1,
      focusedWindowId: newWindow.id,
    }));
    return newWindow;
  },

  closeWindow: (id) => {
    set((state) => {
      const remaining = state.windows.filter((w) => w.id !== id);
      const focused =
        state.focusedWindowId === id
          ? remaining[remaining.length - 1]?.id ?? null
          : state.focusedWindowId;
      return { windows: remaining, focusedWindowId: focused };
    });
  },

  focusWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, zIndex: state.nextZIndex } : w)),
      focusedWindowId: id,
      nextZIndex: state.nextZIndex + 1,
    }));
  },

  minimizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)),
      focusedWindowId: state.focusedWindowId === id ? null : state.focusedWindowId,
    }));
  },

  maximizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, isMaximized: true, isMinimized: false } : w)),
      focusedWindowId: id,
    }));
  },

  restoreWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, isMaximized: false, isMinimized: false } : w)),
      focusedWindowId: id,
    }));
  },

  moveWindow: (id, x, y) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    }));
  },

  resizeWindow: (id, width, height) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, width, height } : w)),
    }));
  },

  updateAppData: (id, data) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, appData: { ...w.appData, ...data } } : w
      ),
    }));
  },

  getWindowById: (id) => get().windows.find((w) => w.id === id),
}));
