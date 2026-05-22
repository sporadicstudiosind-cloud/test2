import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { authApi } from './api';
import { useSocket } from './hooks/useSocket';
import { useNotifications } from './hooks/useNotifications';
import LoginPage from './components/auth/LoginPage';
import AppLayout from './components/layout/AppLayout';
import AchievementToast from './components/ui/AchievementToast';

function AuthGate({ children }) {
  const { user, token, setUser, logout } = useStore();

  useEffect(() => {
    if (!token) return;
    authApi.me()
      .then(res => setUser(res.data.user))
      .catch(() => logout());
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--nexus-bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl nexus-glow flex items-center justify-center text-2xl animate-pulse"
               style={{ background: 'var(--nexus-accent)' }}>N</div>
          <p style={{ color: 'var(--nexus-muted)' }} className="text-sm">Loading Nexus...</p>
        </div>
      </div>
    );
  }
  return children;
}

function AppWithSocket() {
  useSocket();
  useNotifications();

  const { user, achievementQueue, popAchievement } = useStore();
  const theme = user?.appTheme || 'nexus-dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      <AppLayout />
      {achievementQueue.length > 0 && (
        <AchievementToast achievement={achievementQueue[0]} onDone={popAchievement} />
      )}
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={
        <AuthGate>
          <AppWithSocket />
        </AuthGate>
      } />
    </Routes>
  );
}
