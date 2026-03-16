// Real-time sync is not needed — GitHub API is the single source of truth.
// This stub is kept for compatibility.
export function useRealtimeSync() {
  return { isRealtimeSyncActive: false };
}
