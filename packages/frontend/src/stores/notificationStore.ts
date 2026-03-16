import { create } from 'zustand';
import { AppNotification, NotificationType } from '../types';

interface NotificationStore {
  notifications: AppNotification[];
  add: (type: NotificationType, title: string, message: string, duration?: number) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  add: (type, title, message, duration = 4000) => {
    const id = crypto.randomUUID();
    const notification: AppNotification = { id, type, title, message, timestamp: Date.now(), duration };
    set((state) => ({ notifications: [...state.notifications, notification] }));
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
      }, duration);
    }
    return id;
  },

  dismiss: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),

  clear: () => set({ notifications: [] }),
}));
