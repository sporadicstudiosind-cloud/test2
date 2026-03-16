import { useWindowStore } from '../stores/windowStore';
import { useThemeStore } from '../stores/themeStore';
import { useContextMenuStore } from '../stores/contextMenuStore';
import { useAppStore, BUILTIN_APPS } from '../stores/appStore';

const WALLPAPERS: Record<string, string> = {
  'gradient-blue': 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 40%, #312e81 100%)',
  'gradient-purple': 'linear-gradient(135deg, #2d1b69 0%, #7c3aed 50%, #db2777 100%)',
  'gradient-green': 'linear-gradient(135deg, #052e16 0%, #166534 40%, #15803d 100%)',
  'gradient-dark': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
  'gradient-sunset': 'linear-gradient(135deg, #7c2d12 0%, #b91c1c 30%, #9333ea 100%)',
  'solid-dark': '#0f172a',
  'solid-gray': '#1f2937',
};

export function Desktop() {
  const { createWindow } = useWindowStore();
  const { settings } = useThemeStore();
  const { open: openCtx } = useContextMenuStore();
  const { getAllApps } = useAppStore();

  const wallpaper = WALLPAPERS[settings.wallpaper] ?? WALLPAPERS['gradient-blue'];

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openCtx(e.clientX, e.clientY, [
      { id: 'files', label: 'Open File Explorer', icon: '📁', action: () => createWindow('File Explorer', 'file-explorer') },
      { id: 'browser', label: 'Open Browser', icon: '🌐', action: () => createWindow('Web Browser', 'browser') },
      { id: 'divider1', label: '', divider: true, action: () => {} },
      { id: 'settings', label: 'Display Settings', icon: '🎨', action: () => createWindow('Settings', 'settings') },
      { id: 'refresh', label: 'Refresh', icon: '🔄', action: () => window.location.reload() },
    ]);
  };

  const iconSize = settings.desktopIconSize;
  const containerCls = iconSize === 'small' ? 'w-14' : iconSize === 'large' ? 'w-24' : 'w-20';

  // Show built-in system apps as desktop shortcuts
  const shortcuts = BUILTIN_APPS;

  return (
    <div
      className="w-full h-full select-none"
      style={{ background: wallpaper }}
      onContextMenu={handleDesktopContextMenu}
    >
      <div className="p-3 flex flex-col gap-1 items-start w-max">
        {shortcuts.map((app) => (
          <DesktopIcon
            key={app.id}
            name={app.name}
            icon={app.icon}
            containerCls={containerCls}
            onDoubleClick={() => createWindow(app.name, app.id)}
          />
        ))}
        {/* Installed apps with shortcut */}
        {getAllApps()
          .filter((a) => a.type !== 'builtin')
          .map((app) => (
            <DesktopIcon
              key={app.id}
              name={app.name}
              icon={app.icon}
              containerCls={containerCls}
              onDoubleClick={() => createWindow(app.name, app.id)}
            />
          ))}
      </div>
    </div>
  );
}

interface DesktopIconProps {
  name: string;
  icon: string;
  containerCls: string;
  onDoubleClick: () => void;
}

function DesktopIcon({ name, icon, containerCls, onDoubleClick }: DesktopIconProps) {
  return (
    <div
      onDoubleClick={onDoubleClick}
      className={`${containerCls} flex flex-col items-center gap-1 cursor-pointer py-2 px-1 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors`}
    >
      <span className="text-4xl leading-none drop-shadow-lg">{icon}</span>
      <p className="text-white text-center text-xs font-medium leading-tight max-w-full break-words drop-shadow">
        {name}
      </p>
    </div>
  );
}
