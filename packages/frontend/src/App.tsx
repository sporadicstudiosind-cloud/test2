import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/LoginPage';
import { DesktopPage } from './pages/DesktopPage';
import './index.css';

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
          <div className="text-white/60 text-sm">Loading WebOS...</div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <DesktopPage /> : <LoginPage />;
}

export default App;
