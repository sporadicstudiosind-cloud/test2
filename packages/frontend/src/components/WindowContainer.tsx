import { useState, useRef, useEffect } from 'react';
import { Window } from '../types/index';
import { useWindowStore } from '../stores/windowStore';
import { X, Minus, Square } from 'lucide-react';
import { FileExplorer } from './apps/FileExplorer';
import { TextEditor } from './apps/TextEditor';
import { Browser } from './apps/Browser';

interface WindowContainerProps {
  window: Window;
}

export function WindowContainer({ window }: WindowContainerProps) {
  const { moveWindow, resizeWindow, closeWindow, focusWindow, minimizeWindow, maximizeWindow } = useWindowStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Window content based on app ID
  const renderContent = () => {
    switch (window.appId) {
      case 'file-explorer':
        return <FileExplorer />;
      case 'text-editor':
        return <TextEditor />;
      case 'browser':
        return <Browser />;
      default:
        return <div className="p-4 text-gray-600">Unknown application</div>;
    }
  };

  // Handle title bar drag
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    focusWindow(window.id);
    setDragOffset({
      x: e.clientX - window.x,
      y: e.clientY - window.y,
    });
  };

  // Handle window resize
  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
    focusWindow(window.id);
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        moveWindow(window.id, e.clientX - dragOffset.x, e.clientY - dragOffset.y);
      } else if (isResizing && windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect();
        const newWidth = Math.max(300, e.clientX - rect.left);
        const newHeight = Math.max(200, e.clientY - rect.top);
        resizeWindow(window.id, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, window.id, moveWindow, resizeWindow]);

  if (window.isMinimized) {
    return null;
  }

  const style = {
    position: 'absolute' as const,
    left: `${window.x}px`,
    top: `${window.y}px`,
    width: `${window.width}px`,
    height: `${window.height}px`,
    zIndex: window.zIndex,
  };

  return (
    <div
      ref={windowRef}
      style={style}
      className="bg-white rounded-lg shadow-2xl flex flex-col border border-gray-300"
      onClick={() => focusWindow(window.id)}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-t-lg flex items-center justify-between cursor-move select-none"
      >
        <h2 className="font-semibold text-sm">{window.title}</h2>
        <div className="flex gap-1">
          <button
            onClick={() => minimizeWindow(window.id)}
            className="p-1 hover:bg-blue-400 rounded transition-colors"
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => maximizeWindow(window.id)}
            className="p-1 hover:bg-blue-400 rounded transition-colors"
            title="Maximize"
          >
            <Square size={14} />
          </button>
          <button
            onClick={() => closeWindow(window.id)}
            className="p-1 hover:bg-red-500 rounded transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white">{renderContent()}</div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute bottom-0 right-0 w-4 h-4 bg-blue-400 cursor-se-resize rounded-bl hover:bg-blue-500 transition-colors"
        title="Resize"
      />
    </div>
  );
}
