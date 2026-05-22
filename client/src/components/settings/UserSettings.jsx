import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Upload, Palette, User, Shield } from 'lucide-react';
import { useStore } from '../../store';
import { userApi } from '../../api';
import toast from 'react-hot-toast';

const THEMES = [
  { id: 'nexus-dark', label: 'Nexus Dark', color: '#7c3aed' },
  { id: 'cosmic-purple', label: 'Cosmic Purple', color: '#a855f7' },
  { id: 'neon-synthwave', label: 'Neon Synthwave', color: '#ec4899' },
  { id: 'cherry-blossom', label: 'Cherry Blossom', color: '#f472b6' },
  { id: 'ocean-depths', label: 'Ocean Depths', color: '#0ea5e9' },
];

export default function UserSettings() {
  const { user, setUser, toggleSettings } = useStore();
  const [tab, setTab] = useState('profile');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const pfpRef = useRef(null);
  const bgRef = useRef(null);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await userApi.updateMe({ bio });
      setUser(res.data.user);
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save');
    }
    setLoading(false);
  };

  const handlePfpUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('pfp', file);
    try {
      const res = await userApi.uploadPfp(formData);
      setUser({ ...user, pfpUrl: res.data.user.pfpUrl });
      toast.success('Profile picture updated!');
    } catch {
      toast.error('Failed to upload');
    }
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('bg', file);
    try {
      const res = await userApi.uploadCardBg(formData);
      setUser({ ...user, cardBgUrl: res.data.user.cardBgUrl });
      toast.success('Card background updated!');
    } catch {
      toast.error('Failed to upload');
    }
  };

  const handleTheme = async (themeId) => {
    document.documentElement.setAttribute('data-theme', themeId);
    try {
      const res = await userApi.updateMe({ appTheme: themeId });
      setUser(res.data.user);
      toast.success('Theme updated!');
    } catch {}
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account', label: 'Account', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
         onClick={toggleSettings}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl flex max-h-[85vh]"
        style={{ background: 'var(--nexus-surface)', border: '1px solid var(--nexus-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Left nav */}
        <div className="w-48 flex-shrink-0 py-4 px-3"
             style={{ background: 'var(--nexus-bg)', borderRight: '1px solid var(--nexus-border)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest px-2 mb-3"
             style={{ color: 'var(--nexus-muted)' }}>Settings</p>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${tab === id ? 'sidebar-item-active' : ''}`}
              style={{ color: tab === id ? 'var(--nexus-text)' : 'var(--nexus-muted)' }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
               style={{ borderBottom: '1px solid var(--nexus-border)' }}>
            <h2 className="font-bold" style={{ color: 'var(--nexus-text)' }}>
              {TABS.find(t => t.id === tab)?.label}
            </h2>
            <button onClick={toggleSettings} style={{ color: 'var(--nexus-muted)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'profile' && (
              <div className="flex flex-col gap-6">
                {/* Avatar section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden ring-4"
                         style={{ ringColor: 'var(--nexus-accent)', border: '4px solid var(--nexus-elevated)' }}>
                      {user?.pfpUrl ? (
                        <img src={user.pfpUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                             style={{ background: 'var(--nexus-accent)' }}>
                          {user?.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <input ref={pfpRef} type="file" accept="image/*" className="hidden" onChange={handlePfpUpload} />
                    <button
                      onClick={() => pfpRef.current?.click()}
                      className="absolute inset-0 rounded-full flex items-center justify-center transition-all opacity-0 hover:opacity-100"
                      style={{ background: 'rgba(0,0,0,0.5)' }}
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="font-bold text-lg" style={{ color: 'var(--nexus-text)' }}>{user?.username}</p>
                    <p className="text-sm" style={{ color: 'var(--nexus-muted)' }}>{user?.email}</p>
                    <button
                      onClick={() => pfpRef.current?.click()}
                      className="mt-2 text-xs nexus-btn py-1.5 px-3"
                    >
                      Change Picture
                    </button>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nexus-muted)' }}>
                    About Me
                  </label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Tell everyone a bit about yourself..."
                    rows={3}
                    className="nexus-input resize-none"
                    maxLength={200}
                  />
                  <p className="text-xs mt-1 text-right" style={{ color: 'var(--nexus-muted)' }}>{bio.length}/200</p>
                </div>

                {/* Card background */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nexus-muted)' }}>
                    Profile Card Background
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-14 rounded-xl overflow-hidden"
                         style={{ background: user?.cardBgUrl ? undefined : 'var(--nexus-elevated)', border: '1px solid var(--nexus-border)' }}>
                      {user?.cardBgUrl && (
                        <img src={user.cardBgUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
                    <button onClick={() => bgRef.current?.click()} className="nexus-btn-ghost text-sm flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Background
                    </button>
                  </div>
                </div>

                <button onClick={handleSaveProfile} disabled={loading} className="nexus-btn self-start">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {tab === 'appearance' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--nexus-text)' }}>Color Theme</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {THEMES.map(theme => (
                      <motion.button
                        key={theme.id}
                        onClick={() => handleTheme(theme.id)}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                        style={{
                          background: user?.appTheme === theme.id ? `color-mix(in srgb, ${theme.color} 12%, var(--nexus-elevated))` : 'var(--nexus-elevated)',
                          border: `1px solid ${user?.appTheme === theme.id ? theme.color + '60' : 'var(--nexus-border)'}`,
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-8 h-8 rounded-lg flex-shrink-0"
                             style={{ background: theme.color }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--nexus-text)' }}>
                          {theme.label}
                        </span>
                        {user?.appTheme === theme.id && (
                          <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                               style={{ background: theme.color }}>
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-xs mt-3" style={{ color: 'var(--nexus-muted)' }}>
                    More themes available in the Shop!
                  </p>
                </div>
              </div>
            )}

            {tab === 'account' && (
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl" style={{ background: 'var(--nexus-elevated)', border: '1px solid var(--nexus-border)' }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--nexus-text)' }}>Username</p>
                  <p style={{ color: 'var(--nexus-muted)' }}>{user?.username}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'var(--nexus-elevated)', border: '1px solid var(--nexus-border)' }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--nexus-text)' }}>Email</p>
                  <p style={{ color: 'var(--nexus-muted)' }}>{user?.email}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'var(--nexus-elevated)', border: '1px solid var(--nexus-border)' }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--nexus-text)' }}>Member Since</p>
                  <p style={{ color: 'var(--nexus-muted)' }}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'color-mix(in srgb, var(--nexus-danger) 8%, var(--nexus-elevated))', border: '1px solid color-mix(in srgb, var(--nexus-danger) 20%, transparent)' }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--nexus-text)' }}>Danger Zone</p>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to sign out?')) {
                        useStore.getState().logout();
                      }
                    }}
                    className="text-sm px-4 py-2 rounded-xl font-semibold"
                    style={{ background: 'var(--nexus-danger)', color: 'white' }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
