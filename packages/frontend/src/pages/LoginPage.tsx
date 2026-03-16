import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Github, Lock, Database, ChevronRight, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const { login, isLoading, error, setError } = useAuthStore();

  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('os-data');
  const [createIfMissing, setCreateIfMissing] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [step, setStep] = useState<'welcome' | 'form'>('welcome');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !owner || !repo) return;
    setError(null);
    await login(token, owner, repo, createIfMissing);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {step === 'welcome' ? (
          <div className="text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-blue-500/20 border border-blue-400/30 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur">
                <span className="text-5xl">🖥️</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">WebOS</h1>
              <p className="text-blue-200/70 text-lg">Your browser-based desktop, powered by GitHub</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-10 text-center">
              {[
                { icon: '📁', label: 'File System', desc: 'Stored in GitHub' },
                { icon: '🌐', label: 'Web Browser', desc: 'Browse the web' },
                { icon: '🏪', label: 'App Store', desc: 'Install apps' },
              ].map((f) => (
                <div key={f.label} className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <div className="text-white text-xs font-semibold">{f.label}</div>
                  <div className="text-blue-200/50 text-xs">{f.desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('form')}
              className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              Get Started <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
            <button
              onClick={() => { setStep('welcome'); setError(null); }}
              className="text-blue-300/70 hover:text-blue-200 text-sm mb-6 flex items-center gap-1 transition-colors"
            >
              ← Back
            </button>

            <div className="flex items-center gap-3 mb-6">
              <Github size={28} className="text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">Connect to GitHub</h2>
                <p className="text-blue-200/60 text-sm">Your files are stored in a GitHub repository</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-blue-200/80 text-sm font-medium mb-1.5">
                  <Lock size={13} className="inline mr-1" />
                  Personal Access Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full px-3 py-2.5 pr-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  >
                    {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="mt-1 text-blue-200/40 text-xs">
                  Needs <code className="bg-white/10 px-1 rounded">repo</code> scope.{' '}
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=WebOS"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Create one →
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-blue-200/80 text-sm font-medium mb-1.5">
                  <Database size={13} className="inline mr-1" />
                  GitHub Username / Org
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="your-username"
                  className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15"
                  required
                />
              </div>

              <div>
                <label className="block text-blue-200/80 text-sm font-medium mb-1.5">
                  Repository Name (data storage)
                </label>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="os-data"
                  className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createIfMissing}
                  onChange={(e) => setCreateIfMissing(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-blue-200/70 text-sm">Create repository if it doesn't exist</span>
              </label>

              <button
                type="submit"
                disabled={isLoading || !token || !owner || !repo}
                className="w-full py-3 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/40 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>Launch Desktop</>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
