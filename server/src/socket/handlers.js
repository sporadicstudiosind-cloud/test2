const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Track online users: userId -> { socketId, user }
const onlineUsers = new Map();

function getUsersOnlineList() {
  return Array.from(onlineUsers.values()).map(u => ({
    id: u.user.id,
    username: u.user.username,
    pfpUrl: u.user.pfpUrl,
    bio: u.user.bio,
    cardBgUrl: u.user.cardBgUrl,
  }));
}

function setupSocketHandlers(io) {
  // Auth middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, pfpUrl: true, bio: true, cardBgUrl: true },
      });
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    console.log(`✅ ${user.username} connected (${socket.id})`);

    // Track online status
    onlineUsers.set(user.id, { socketId: socket.id, user });
    socket.join(`user:${user.id}`);

    // Broadcast online status to all
    io.emit('userOnline', { userId: user.id, user });
    io.emit('onlineUsers', getUsersOnlineList());

    // Send current online users to newly connected client
    socket.emit('onlineUsers', getUsersOnlineList());

    // --- Channel events ---
    socket.on('joinChannel', ({ channelId }) => {
      socket.join(`channel:${channelId}`);
      socket.to(`channel:${channelId}`).emit('userJoinedChannel', { channelId, user });
    });

    socket.on('leaveChannel', ({ channelId }) => {
      socket.leave(`channel:${channelId}`);
    });

    // --- Typing indicators ---
    socket.on('typing', ({ channelId, isTyping }) => {
      socket.to(`channel:${channelId}`).emit('userTyping', {
        userId: user.id,
        username: user.username,
        channelId,
        isTyping,
      });
    });

    socket.on('typingDM', ({ receiverId, isTyping }) => {
      io.to(`user:${receiverId}`).emit('userTypingDM', {
        userId: user.id,
        username: user.username,
        isTyping,
      });
    });

    // --- Join DM room ---
    socket.on('joinDM', ({ userId }) => {
      const dmRoom = [user.id, userId].sort().join(':');
      socket.join(`dm:${dmRoom}`);
    });

    // --- Voice calling (WebRTC signaling) ---
    socket.on('voiceOffer', ({ targetUserId, offer, channelId }) => {
      io.to(`user:${targetUserId}`).emit('voiceOffer', {
        from: user.id,
        fromUsername: user.username,
        offer,
        channelId,
      });
    });

    socket.on('voiceAnswer', ({ targetUserId, answer }) => {
      io.to(`user:${targetUserId}`).emit('voiceAnswer', {
        from: user.id,
        answer,
      });
    });

    socket.on('voiceIceCandidate', ({ targetUserId, candidate }) => {
      io.to(`user:${targetUserId}`).emit('voiceIceCandidate', {
        from: user.id,
        candidate,
      });
    });

    socket.on('joinVoiceChannel', ({ channelId }) => {
      socket.join(`voice:${channelId}`);
      const roomSockets = io.sockets.adapter.rooms.get(`voice:${channelId}`);
      const peers = roomSockets ? [...roomSockets].filter(s => s !== socket.id) : [];
      socket.emit('voicePeers', { peers: peers.map(s => {
        const sock = io.sockets.sockets.get(s);
        return sock ? { socketId: s, userId: sock.user?.id, username: sock.user?.username } : null;
      }).filter(Boolean) });
      socket.to(`voice:${channelId}`).emit('voicePeerJoined', {
        socketId: socket.id,
        userId: user.id,
        username: user.username,
      });
    });

    socket.on('leaveVoiceChannel', ({ channelId }) => {
      socket.leave(`voice:${channelId}`);
      socket.to(`voice:${channelId}`).emit('voicePeerLeft', {
        socketId: socket.id,
        userId: user.id,
      });
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
      console.log(`❌ ${user.username} disconnected`);
      onlineUsers.delete(user.id);
      io.emit('userOffline', { userId: user.id });
      io.emit('onlineUsers', getUsersOnlineList());

      // Notify voice channels
      socket.rooms.forEach(room => {
        if (room.startsWith('voice:')) {
          const channelId = room.replace('voice:', '');
          io.to(room).emit('voicePeerLeft', { socketId: socket.id, userId: user.id });
        }
      });
    });
  });
}

module.exports = { setupSocketHandlers };
