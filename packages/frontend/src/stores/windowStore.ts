import { create } from 'zustand';
import { Window } from '../types/index';
import { v4 as uuidv4 } from 'uuid';

interface WindowStore {
  windows: Window[];
  focusedWindowId: string | null;
  nextZIndex: number;

  // Actions
  createWindow: (title: string, appId?: string) => Window;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  getWindowById: (id: string) => Window | undefined;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  focusedWindowId: null,
  nextZIndex: 100,

  createWindow: (title: string, appId?: string) => {
    const newWindow: Window = {
      id: uuidv4(),
      title,
      appId,
      x: 50,
      y: 50,
      width: 800,
      height: 600,
      zIndex: get().nextZIndex,
      isMinimized: false,
      isMaximized: false,
    };

    set((state) => ({
      windows: [...state.windows, newWindow],
      nextZIndex: state.nextZIndex + 1,
      focusedWindowId: newWindow.id,
    }));

    return newWindow;
  },

  closeWindow: (id: string) => {
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
      focusedWindowId: state.focusedWindowId === id ? null : state.focusedWindowId,
    }));
  },

  focusWindow: (id: string) => {
    set((state) => {
      const window = state.windows.find((w) => w.id === id);
      if (!window) return state;

      return {
        windows: state.windows.map((w) => (w.id === id ? { ...w, zIndex: state.nextZIndex } : w)),
        focusedWindowId: id,
        nextZIndex: state.nextZIndex + 1,
      };
    });
  },

  minimizeWindow: (id: string) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, isMinimized: !w.isMinimized } : w)),
    }));
  },

  maximizeWindow: (id: string) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)),
    }));
  },

  moveWindow: (id: string, x: number, y: number) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    }));
  },

  resizeWindow: (id: string, width: number, height: number) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, width, height } : w)),
    }));
  },

  getWindowById: (id: string) => {
    return get().windows.find((w) => w.id === id);
  },
}));
