import { useEffect } from 'react';
import { Desktop } from '../components/Desktop';
import { Taskbar } from '../components/Taskbar';
import { WindowContainer } from '../components/WindowContainer';
import { NotificationOverlay } from '../components/NotificationOverlay';
import { ContextMenuOverlay } from '../components/ContextMenuOverlay';
import { useWindowStore } from '../stores/windowStore';
import { useThemeStore } from '../stores/themeStore';
import { useAppStore } from '../stores/appStore';

export function DesktopPage() {
  const { windows } = useWindowStore();
  const { loadSettings, applyTheme } = useThemeStore();
  const { loadInstalledApps } = useAppStore();

  useEffect(() => {
    loadSettings();
    loadInstalledApps();
    applyTheme();
  }, [loadSettings, loadInstalledApps, applyTheme]);

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col desktop-root">
      <div className="flex-1 relative overflow-hidden">
        <Desktop />
        {windows.map((win) => (
          <WindowContainer key={win.id} window={win} />
        ))}
      </div>
      <Taskbar />
      <NotificationOverlay />
      <ContextMenuOverlay />
    </div>
  );
}
