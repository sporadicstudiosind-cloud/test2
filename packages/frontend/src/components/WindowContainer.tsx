import { useState, useRef, useEffect } from 'react';
import { AppWindow } from '../types';
import { useWindowStore } from '../stores/windowStore';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { FileExplorer } from './apps/FileExplorer';
import { TextEditor } from './apps/TextEditor';
import { Browser } from './apps/Browser';
import { AppStore } from './apps/AppStore';
import { Settings } from './apps/Settings';
import { AppRunner } from './apps/AppRunner';

interface Props {
  window: AppWindow;
}

export function WindowContainer({ window: win }: Props) {
  const {
    moveWindow,
    resizeWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
  } = useWindowStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState<string>('se');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0, wx: 0, wy: 0 });
  const winRef = useRef<HTMLDivElement>(null);

  const renderContent = () => {
    switch (win.appId) {
      case 'file-explorer': return <FileExplorer windowId={win.id} appData={win.appData} />;
      case 'text-editor':   return <TextEditor windowId={win.id} appData={win.appData} />;
      case 'browser':       return <Browser windowId={win.id} appData={win.appData} />;
      case 'app-store':     return <AppStore />;
      case 'settings':      return <Settings />;
      default:              return <AppRunner manifest={win.appData as any} />;
    }
  };

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (win.isMaximized) return;
    e.preventDefault();
    setIsDragging(true);
    focusWindow(win.id);
    setDragOffset({ x: e.clientX - win.x, y: e.clientY - win.y });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, dir: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDir(dir);
    focusWindow(win.id);
    setResizeStart({ x: e.clientX, y: e.clientY, w: win.width, h: win.height, wx: win.x, wy: win.y });
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const onMove = (e: MouseEvent) => {
      if (isDragging) {
        const nx = Math.max(0, e.clientX - dragOffset.x);
        const ny = Math.max(0, e.clientY - dragOffset.y);
        moveWindow(win.id, nx, ny);
      } else if (isResizing) {
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;
        let nw = resizeStart.w;
        let nh = resizeStart.h;
        let nx = resizeStart.wx;
        let ny = resizeStart.wy;
        if (resizeDir.includes('e')) nw = Math.max(320, resizeStart.w + dx);
        if (resizeDir.includes('s')) nh = Math.max(200, resizeStart.h + dy);
        if (resizeDir.includes('w')) { nw = Math.max(320, resizeStart.w - dx); nx = resizeStart.wx + (resizeStart.w - nw); }
        if (resizeDir.includes('n')) { nh = Math.max(200, resizeStart.h - dy); ny = resizeStart.wy + (resizeStart.h - nh); }
        resizeWindow(win.id, nw, nh);
        moveWindow(win.id, nx, ny);
      }
    };
    const onUp = () => { setIsDragging(false); setIsResizing(false); };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, resizeDir, win.id, moveWindow, resizeWindow]);

  if (win.isMinimized) return null;

  const style = win.isMaximized
    ? { position: 'absolute' as const, inset: 0, zIndex: win.zIndex }
    : { position: 'absolute' as const, left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex };

  return (
    <div
      ref={winRef}
      style={style}
      className="flex flex-col shadow-2xl rounded-xl overflow-hidden border border-white/10 window-frame"
      onClick={() => focusWindow(win.id)}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleTitleMouseDown}
        onDoubleClick={() => win.isMaximized ? restoreWindow(win.id) : maximizeWindow(win.id)}
        className="h-9 flex items-center justify-between px-3 cursor-move select-none shrink-0"
        style={{ background: 'rgba(15,23,42,0.98)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">
            {win.appId === 'file-explorer' ? '📁' : win.appId === 'text-editor' ? '📝' : win.appId === 'browser' ? '🌐' : win.appId === 'app-store' ? '🏪' : win.appId === 'settings' ? '⚙️' : '🔲'}
          </span>
          <span className="text-white/90 text-sm font-medium truncate max-w-48">{win.title}</span>
        </div>
        <div className="flex gap-1">
          <WinBtn color="yellow" title="Minimize" onClick={() => minimizeWindow(win.id)}>
            <Minus size={10} />
          </WinBtn>
          <WinBtn color="green" title={win.isMaximized ? 'Restore' : 'Maximize'} onClick={() => win.isMaximized ? restoreWindow(win.id) : maximizeWindow(win.id)}>
            {win.isMaximized ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
          </WinBtn>
          <WinBtn color="red" title="Close" onClick={() => closeWindow(win.id)}>
            <X size={10} />
          </WinBtn>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-gray-950">
        {renderContent()}
      </div>

      {/* Resize handles (not when maximized) */}
      {!win.isMaximized && (
        <>
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'e')} className="absolute right-0 top-4 bottom-4 w-1 cursor-e-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 's')} className="absolute bottom-0 left-4 right-4 h-1 cursor-s-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'w')} className="absolute left-0 top-4 bottom-4 w-1 cursor-w-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'n')} className="absolute top-0 left-4 right-4 h-1 cursor-n-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'se')} className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize" />
        </>
      )}
    </div>
  );
}

function WinBtn({ color, title, onClick, children }: { color: string; title: string; onClick: () => void; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    red: 'bg-red-500 hover:bg-red-400',
    yellow: 'bg-yellow-500 hover:bg-yellow-400',
    green: 'bg-green-500 hover:bg-green-400',
  };
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      className={`w-5 h-5 rounded-full flex items-center justify-center text-black/70 transition-colors ${colors[color]}`}
    >
      {children}
    </button>
  );
}
