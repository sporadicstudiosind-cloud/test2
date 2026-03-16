import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
  const { login } = useAuthStore();

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">Windows Clone</h1>
        <p className="text-xl text-gray-300 mb-8">A React-powered desktop environment in your browser</p>
        <button
          onClick={login}
          className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
        >
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
}
