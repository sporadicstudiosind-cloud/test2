// Socket.io is not used in the GitHub-powered backend.
// This stub is kept for compatibility.
export function useSocket() {
  return {
    socket: null,
    isConnected: false,
    emit: (_event: string, _data?: unknown) => {},
    on: (_event: string, _callback: (data: unknown) => void) => () => {},
  };
}
