import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  token: localStorage.getItem('nexus_token'),
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('nexus_token', token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('nexus_token');
    set({ user: null, token: null, activeChannel: null, activeDM: null });
  },

  // Navigation
  activeChannel: null,
  activeDM: null,
  setActiveChannel: (channel) => set({ activeChannel: channel, activeDM: null }),
  setActiveDM: (user) => set({ activeDM: user, activeChannel: null }),

  // Online users
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (user) => set(state => ({
    onlineUsers: state.onlineUsers.some(u => u.id === user.id)
      ? state.onlineUsers.map(u => u.id === user.id ? user : u)
      : [...state.onlineUsers, user],
  })),
  removeOnlineUser: (userId) => set(state => ({
    onlineUsers: state.onlineUsers.filter(u => u.id !== userId),
  })),

  // Channels
  channels: [],
  setChannels: (channels) => set({ channels }),
  updateChannelUnread: (channelId, unread) => set(state => ({
    channels: state.channels.map(ch =>
      ch.id === channelId ? { ...ch, unread } : ch
    ),
  })),
  markChannelRead: (channelId) => set(state => ({
    channels: state.channels.map(ch =>
      ch.id === channelId ? { ...ch, unread: 0 } : ch
    ),
  })),

  // Messages (per channel/DM)
  messages: {},
  setMessages: (key, msgs) => set(state => ({
    messages: { ...state.messages, [key]: msgs },
  })),
  addMessage: (key, msg) => set(state => {
    const existing = state.messages[key] || [];
    if (existing.some(m => m.id === msg.id)) return {};
    return { messages: { ...state.messages, [key]: [...existing, msg] } };
  }),
  updateMessage: (key, msg) => set(state => ({
    messages: {
      ...state.messages,
      [key]: (state.messages[key] || []).map(m => m.id === msg.id ? msg : m),
    },
  })),
  deleteMessage: (key, messageId) => set(state => ({
    messages: {
      ...state.messages,
      [key]: (state.messages[key] || []).filter(m => m.id !== messageId),
    },
  })),
  updateReactions: (key, messageId, reactions) => set(state => ({
    messages: {
      ...state.messages,
      [key]: (state.messages[key] || []).map(m =>
        m.id === messageId ? { ...m, reactions } : m
      ),
    },
  })),

  // Typing
  typingUsers: {},
  setTyping: (key, userId, username, isTyping) => set(state => {
    const current = state.typingUsers[key] || {};
    if (isTyping) return { typingUsers: { ...state.typingUsers, [key]: { ...current, [userId]: username } } };
    const next = { ...current };
    delete next[userId];
    return { typingUsers: { ...state.typingUsers, [key]: next } };
  }),

  // UI
  showSearch: false,
  showShop: false,
  showSettings: false,
  showAchievements: false,
  toggleSearch: () => set(s => ({ showSearch: !s.showSearch })),
  toggleShop: () => set(s => ({ showShop: !s.showShop })),
  toggleSettings: () => set(s => ({ showSettings: !s.showSettings })),
  toggleAchievements: () => set(s => ({ showAchievements: !s.showAchievements })),

  // Achievements queue
  achievementQueue: [],
  pushAchievement: (ach) => set(s => ({ achievementQueue: [...s.achievementQueue, ach] })),
  popAchievement: () => set(s => ({ achievementQueue: s.achievementQueue.slice(1) })),

  // Voice
  voiceChannelId: null,
  setVoiceChannel: (id) => set({ voiceChannelId: id }),
  leaveVoice: () => set({ voiceChannelId: null }),
}));
