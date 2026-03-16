import { useAuthStore } from '../stores/authStore';
import { useWindowStore } from '../stores/windowStore';
import { Clock, Power, Menu } from 'lucide-react';
import { useState } from 'react';

export function Taskbar() {
  const { user, logout } = useAuthStore();
  const { windows, createWindow, focusWindow, minimizeWindow } = useWindowStore();
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [showStartMenu, setShowStartMenu] = useState(false);

  // Update time
  setInterval(() => {
    setTime(new Date().toLocaleTimeString());
  }, 1000);

  const handleStartClick = () => {
    setShowStartMenu(!showStartMenu);
  };

  const handleNewWindow = (appId: string, title: string) => {
    createWindow(title, appId);
    setShowStartMenu(false);
  };

  return (
    <div className="h-12 bg-gray-800 border-t border-gray-700 flex items-center px-2 gap-2 select-none">
      {/* Start Button */}
      <div className="relative">
        <button
          onClick={handleStartClick}
          className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold transition-colors"
        >
          <Menu size={16} />
          Start
        </button>

        {/* Start Menu */}
        {showStartMenu && (
          <div className="absolute bottom-12 left-0 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50">
            <div className="p-2 space-y-1">
              <MenuButton onClick={() => handleNewWindow('file-explorer', 'File Explorer')}>
                📁 File Explorer
              </MenuButton>
              <MenuButton onClick={() => handleNewWindow('text-editor', 'Text Editor')}>
                📝 Text Editor
              </MenuButton>
              <MenuButton onClick={() => handleNewWindow('browser', 'Web Browser')}>
                🌐 Web Browser
              </MenuButton>
              <hr className="my-2 border-gray-600" />
              <MenuButton onClick={logout}>
                🔚 Logout
              </MenuButton>
            </div>
          </div>
        )}
      </div>

      {/* Open Windows */}
      <div className="flex-1 flex gap-1 ml-2 overflow-x-auto">
        {windows.map((window) => (
          <button
            key={window.id}
            onClick={() => {
              if (window.isMinimized) {
                minimizeWindow(window.id);
              } else {
                focusWindow(window.id);
              }
            }}
            className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap transition-colors ${
              window.isMinimized
                ? 'bg-gray-600 text-gray-300'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {window.title}
          </button>
        ))}
      </div>

      {/* System Tray */}
      <div className="flex items-center gap-3 ml-auto pl-3 border-l border-gray-700">
        <div className="flex items-center gap-1 text-white text-xs">
          <Clock size={14} />
          {time}
        </div>
        <div className="text-gray-300 text-xs">{user?.username}</div>
        <button
          onClick={logout}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Logout"
        >
          <Power size={16} className="text-red-500" />
        </button>
      </div>
    </div>
  );
}

function MenuButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-white text-sm hover:bg-blue-500 rounded transition-colors"
    >
      {children}
    </button>
  );
}
