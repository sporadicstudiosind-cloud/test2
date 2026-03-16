import { useWindowStore } from '../stores/windowStore';
import { Folder, File } from 'lucide-react';

export function Desktop() {
  const { createWindow } = useWindowStore();

  const handleDesktopIconClick = (appName: string) => {
    switch (appName) {
      case 'file-explorer':
        createWindow('File Explorer', 'file-explorer');
        break;
      case 'text-editor':
        createWindow('Text Editor', 'text-editor');
        break;
      case 'browser':
        createWindow('Web Browser', 'browser');
        break;
      default:
        break;
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 p-4 select-none">
      {/* Desktop Icons Grid */}
      <div className="grid grid-cols-4 gap-6 w-max">
        <DesktopIcon
          name="File Explorer"
          icon={Folder}
          onClick={() => handleDesktopIconClick('file-explorer')}
        />
        <DesktopIcon
          name="Text Editor"
          icon={File}
          onClick={() => handleDesktopIconClick('text-editor')}
        />
        <DesktopIcon
          name="Web Browser"
          icon={File}
          onClick={() => handleDesktopIconClick('browser')}
        />
      </div>
    </div>
  );
}

interface DesktopIconProps {
  name: string;
  icon: React.ComponentType<{ size: number; className: string }>;
  onClick: () => void;
}

function DesktopIcon({ name, icon: Icon, onClick }: DesktopIconProps) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
    >
      <div className="w-16 h-16 bg-yellow-400 rounded-lg flex items-center justify-center shadow-lg">
        <Icon size={32} className="text-gray-800" />
      </div>
      <p className="text-white text-center text-xs font-semibold max-w-16 break-words">{name}</p>
    </div>
  );
}
