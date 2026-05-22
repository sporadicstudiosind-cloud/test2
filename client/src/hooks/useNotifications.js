import { useEffect } from 'react';

export function useNotifications() {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const notify = (title, body, icon = '/nexus-icon.svg') => {
    if (document.hasFocus()) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon });
    }
  };

  return { notify };
}
