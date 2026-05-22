import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useStore } from '../store';
import toast from 'react-hot-toast';

let socketInstance = null;

export function getSocket() {
  return socketInstance;
}

export function useSocket() {
  const token = useStore(s => s.token);
  const user = useStore(s => s.user);
  const {
    setOnlineUsers, addOnlineUser, removeOnlineUser,
    addMessage, updateMessage, deleteMessage, updateReactions,
    setTyping, updateChannelUnread, pushAchievement,
    activeChannel, activeDM,
  } = useStore();

  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) return;

    const socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    socketInstance = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    socket.on('userOnline', ({ userId, user: onlineUser }) => {
      addOnlineUser(onlineUser);
    });

    socket.on('userOffline', ({ userId }) => {
      removeOnlineUser(userId);
    });

    socket.on('newMessage', ({ message, channelId }) => {
      addMessage(`channel:${channelId}`, message);

      // If not in this channel, increment unread
      const state = useStore.getState();
      if (!state.activeChannel || state.activeChannel.id !== channelId) {
        const ch = state.channels.find(c => c.id === channelId);
        if (ch) {
          useStore.setState(s => ({
            channels: s.channels.map(c =>
              c.id === channelId ? { ...c, unread: (c.unread || 0) + 1 } : c
            ),
          }));
        }
      }
    });

    socket.on('newDM', ({ message }) => {
      const state = useStore.getState();
      const otherId = message.senderId === state.user?.id ? message.receiverId : message.senderId;
      addMessage(`dm:${otherId}`, message);
    });

    socket.on('messageEdited', ({ message, channelId }) => {
      updateMessage(`channel:${channelId}`, message);
    });

    socket.on('messageDeleted', ({ messageId, channelId }) => {
      deleteMessage(`channel:${channelId}`, messageId);
    });

    socket.on('reactionsUpdated', ({ messageId, reactions, channelId }) => {
      // Find which channel this belongs to - we'll update all channels
      const state = useStore.getState();
      Object.keys(state.messages).forEach(key => {
        if (state.messages[key]?.some(m => m.id === messageId)) {
          updateReactions(key, messageId, reactions);
        }
      });
    });

    socket.on('userTyping', ({ userId, username, channelId, isTyping }) => {
      if (userId !== user.id) {
        setTyping(`channel:${channelId}`, userId, username, isTyping);
        if (isTyping) {
          setTimeout(() => setTyping(`channel:${channelId}`, userId, username, false), 5000);
        }
      }
    });

    socket.on('userTypingDM', ({ userId, username, isTyping }) => {
      if (userId !== user.id) {
        setTyping(`dm:${userId}`, userId, username, isTyping);
        if (isTyping) {
          setTimeout(() => setTyping(`dm:${userId}`, userId, username, false), 5000);
        }
      }
    });

    socket.on('achievementUnlocked', (achievements) => {
      achievements.forEach(ach => {
        pushAchievement(ach);
        // Update user points
        useStore.setState(s => ({
          user: s.user ? { ...s.user, points: (s.user.points || 0) + ach.pointReward } : s.user,
        }));
      });
    });

    socket.on('mentioned', ({ message, channelId, channelName, mentionedBy }) => {
      toast(`📣 ${mentionedBy} mentioned you in #${channelName}`, {
        duration: 6000,
        icon: '🔔',
      });

      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification(`Nexus — Mentioned in #${channelName}`, {
          body: `${mentionedBy}: ${message.content}`,
          icon: '/nexus-icon.svg',
        });
      }
    });

    return () => {
      socket.disconnect();
      socketInstance = null;
    };
  }, [token, user?.id]);

  return socketRef.current;
}
