import { useNotificationStore } from '../stores/notificationStore';
import { X, Info, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

const ICONS = {
  info: <Info size={16} className="text-blue-400" />,
  success: <CheckCircle size={16} className="text-green-400" />,
  error: <AlertCircle size={16} className="text-red-400" />,
  warning: <AlertTriangle size={16} className="text-yellow-400" />,
};

const BORDERS = {
  info: 'border-blue-500/40',
  success: 'border-green-500/40',
  error: 'border-red-500/40',
  warning: 'border-yellow-500/40',
};

export function NotificationOverlay() {
  const { notifications, dismiss } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-16 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto flex items-start gap-3 bg-gray-900/95 border ${BORDERS[n.type]} rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm min-w-72 max-w-sm animate-in slide-in-from-right-4`}
        >
          <div className="mt-0.5 shrink-0">{ICONS[n.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight">{n.title}</p>
            {n.message && <p className="text-white/60 text-xs mt-0.5 leading-snug">{n.message}</p>}
          </div>
          <button
            onClick={() => dismiss(n.id)}
            className="shrink-0 text-white/30 hover:text-white/70 transition-colors mt-0.5"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
