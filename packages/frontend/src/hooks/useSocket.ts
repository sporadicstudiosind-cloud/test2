import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Reuse global socket instance
    if (!globalSocket) {
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

      globalSocket = io(wsUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      globalSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      globalSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      globalSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }

    socketRef.current = globalSocket;

    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, []);

  const emit = (event: string, data?: any) => {
    if (globalSocket?.connected) {
      globalSocket.emit(event, data);
    }
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on(event, callback);
    }

    return () => {
      if (globalSocket) {
        globalSocket.off(event, callback);
      }
    };
  };

  return {
    socket: globalSocket,
    isConnected,
    emit,
    on,
  };
}
