import { useEffect, useRef } from 'react';
import { useContextMenuStore } from '../stores/contextMenuStore';

export function ContextMenuOverlay() {
  const { isOpen, x, y, items, close } = useContextMenuStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  // Clamp to viewport
  const menuWidth = 200;
  const menuHeight = items.length * 36 + 16;
  const finalX = Math.min(x, window.innerWidth - menuWidth - 8);
  const finalY = Math.min(y, window.innerHeight - menuHeight - 8);

  return (
    <div
      ref={menuRef}
      className="fixed z-[9998] bg-gray-800/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl py-1.5 min-w-[180px]"
      style={{ left: finalX, top: finalY }}
    >
      {items.map((item) => (
        item.divider ? (
          <div key={item.id} className="h-px bg-white/10 mx-2 my-1" />
        ) : (
          <button
            key={item.id}
            disabled={item.disabled}
            onClick={() => { item.action(); close(); }}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {item.icon && <span className="text-base">{item.icon}</span>}
            {item.label}
          </button>
        )
      ))}
    </div>
  );
}
