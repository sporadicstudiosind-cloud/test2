import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/LoginPage';
import { DesktopPage } from './pages/DesktopPage';
import './App.css';

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <DesktopPage /> : <LoginPage />;
}

export default App;
