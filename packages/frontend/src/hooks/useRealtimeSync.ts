import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useFileStore } from '../stores/fileStore';
import { useWindowStore } from '../stores/windowStore';

export function useRealtimeSync() {
  const { on, emit } = useSocket();
  const { listFiles, currentPath } = useFileStore();
  const { windows } = useWindowStore();

  useEffect(() => {
    // Listen for file updates from other clients
    const unsubscribeFileChanged = on('file:updated', (data) => {
      console.log('File updated from server:', data);
      // Refresh the current directory if the change affects it
      if (data.path && currentPath) {
        listFiles(currentPath);
      }
    });

    return () => {
      unsubscribeFileChanged();
    };
  }, [on, listFiles, currentPath]);

  useEffect(() => {
    // Listen for window updates from other clients
    const unsubscribeWindowChanged = on('window:updated', (data) => {
      console.log('Window updated from server:', data);
      // Handle window updates if needed
    });

    return () => {
      unsubscribeWindowChanged();
    };
  }, [on]);

  // Emit window changes to server
  useEffect(() => {
    if (windows.length > 0) {
      emit('window:changed', { windows });
    }
  }, [windows, emit]);

  return {
    isRealtimeSyncActive: true,
  };
}
