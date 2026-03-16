import { useEffect } from 'react';
import { Desktop } from '../components/Desktop';
import { Taskbar } from '../components/Taskbar';
import { WindowContainer } from '../components/WindowContainer';
import { useWindowStore } from '../stores/windowStore';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

export function DesktopPage() {
  const { windows } = useWindowStore();
  useRealtimeSync(); // Initialize real-time sync

  useEffect(() => {
    // Initialize desktop
  }, []);

  return (
    <div className="w-screen h-screen bg-blue-600 overflow-hidden flex flex-col">
      {/* Desktop Area */}
      <div className="flex-1 relative">
        <Desktop />

        {/* Windows */}
        {windows.map((window) => (
          <WindowContainer key={window.id} window={window} />
        ))}
      </div>

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}
