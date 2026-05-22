const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { uploadMedia, getMediaType } = require('../middleware/upload');
const { checkAndAwardAchievements } = require('../lib/achievements');

const prisma = new PrismaClient();

// POST /api/messages/channel/:channelId - send message to channel
router.post('/channel/:channelId', authMiddleware, uploadMedia.single('media'), async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content } = req.body;

    if (!content && !req.file)
      return res.status(400).json({ error: 'Message content or file required' });

    let mediaUrl = null;
    let mediaType = null;
    if (req.file) {
      mediaUrl = `/uploads/media/${req.file.filename}`;
      mediaType = getMediaType(req.file.mimetype);
    }

    const message = await prisma.channelMessage.create({
      data: {
        content: content || '',
        mediaUrl,
        mediaType,
        userId: req.user.id,
        channelId,
      },
      include: {
        user: { select: { id: true, username: true, pfpUrl: true } },
        reactions: true,
      },
    });

    // Increment message count and check achievements
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { messageCount: { increment: 1 } },
    });

    const newAchievements = await checkAndAwardAchievements(req.user.id, updatedUser.messageCount);

    // Emit via socket
    const io = req.app.get('io');
    io.to(`channel:${channelId}`).emit('newMessage', { message, channelId });

    // Emit achievements
    if (newAchievements.length > 0) {
      io.to(`user:${req.user.id}`).emit('achievementUnlocked', newAchievements);
    }

    // Handle @mentions
    const mentions = [...(content || '').matchAll(/@(\w+)/g)].map(m => m[1]);
    if (mentions.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { username: { in: mentions } },
        select: { id: true, username: true },
      });
      for (const mu of mentionedUsers) {
        io.to(`user:${mu.id}`).emit('mentioned', {
          message,
          channelId,
          channelName: channelId,
          mentionedBy: req.user.username,
        });
      }
    }

    res.json({ message, newAchievements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/messages/dm/:userId - send DM
router.post('/dm/:userId', authMiddleware, uploadMedia.single('media'), async (req, res) => {
  try {
    const { content } = req.body;
    const receiverId = req.params.userId;

    if (!content && !req.file)
      return res.status(400).json({ error: 'Message content or file required' });

    let mediaUrl = null;
    let mediaType = null;
    if (req.file) {
      mediaUrl = `/uploads/media/${req.file.filename}`;
      mediaType = getMediaType(req.file.mimetype);
    }

    const message = await prisma.directMessage.create({
      data: {
        content: content || '',
        mediaUrl,
        mediaType,
        senderId: req.user.id,
        receiverId,
      },
      include: {
        sender: { select: { id: true, username: true, pfpUrl: true } },
        receiver: { select: { id: true, username: true, pfpUrl: true } },
        reactions: true,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { messageCount: { increment: 1 } },
    });
    const newAchievements = await checkAndAwardAchievements(req.user.id, updatedUser.messageCount);

    const io = req.app.get('io');
    const dmRoom = [req.user.id, receiverId].sort().join(':');
    io.to(`dm:${dmRoom}`).emit('newDM', { message });

    if (newAchievements.length > 0) {
      io.to(`user:${req.user.id}`).emit('achievementUnlocked', newAchievements);
    }

    res.json({ message, newAchievements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/messages/dm/:userId - get DM history
router.get('/dm/:userId', authMiddleware, async (req, res) => {
  try {
    const { cursor, limit = 50 } = req.query;
    const take = Math.min(parseInt(limit), 100);
    const other = req.params.userId;

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: other },
          { senderId: other, receiverId: req.user.id },
        ],
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        sender: { select: { id: true, username: true, pfpUrl: true } },
        reactions: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    res.json({ messages: messages.reverse(), hasMore: messages.length === take });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/messages/:id/react - toggle reaction (channel or DM)
router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const { emoji, type = 'channel' } = req.body;
    const messageId = req.params.id;

    if (type === 'channel') {
      const existing = await prisma.channelReaction.findUnique({
        where: { emoji_userId_messageId: { emoji, userId: req.user.id, messageId } },
      });

      if (existing) {
        await prisma.channelReaction.delete({ where: { id: existing.id } });
      } else {
        await prisma.channelReaction.create({
          data: { emoji, userId: req.user.id, messageId },
        });
      }

      const reactions = await prisma.channelReaction.findMany({
        where: { messageId },
        include: { user: { select: { id: true, username: true } } },
      });

      const message = await prisma.channelMessage.findUnique({
        where: { id: messageId },
        select: { channelId: true },
      });

      const io = req.app.get('io');
      if (message) {
        io.to(`channel:${message.channelId}`).emit('reactionsUpdated', { messageId, reactions, channelId: message.channelId });
      }

      return res.json({ reactions });
    }

    if (type === 'dm') {
      const existing = await prisma.dMReaction.findUnique({
        where: { emoji_userId_messageId: { emoji, userId: req.user.id, messageId } },
      });

      if (existing) {
        await prisma.dMReaction.delete({ where: { id: existing.id } });
      } else {
        await prisma.dMReaction.create({
          data: { emoji, userId: req.user.id, messageId },
        });
      }

      const reactions = await prisma.dMReaction.findMany({
        where: { messageId },
        include: { user: { select: { id: true, username: true } } },
      });

      return res.json({ reactions });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/messages/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const msg = await prisma.channelMessage.findUnique({ where: { id: req.params.id } });
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await prisma.channelMessage.delete({ where: { id: req.params.id } });

    const io = req.app.get('io');
    io.to(`channel:${msg.channelId}`).emit('messageDeleted', { messageId: req.params.id, channelId: msg.channelId });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/messages/:id - edit message
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const msg = await prisma.channelMessage.findUnique({ where: { id: req.params.id } });
    if (!msg) return res.status(404).json({ error: 'Not found' });
    if (msg.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.channelMessage.update({
      where: { id: req.params.id },
      data: { content, isEdited: true },
      include: {
        user: { select: { id: true, username: true, pfpUrl: true } },
        reactions: { include: { user: { select: { id: true, username: true } } } },
      },
    });

    const io = req.app.get('io');
    io.to(`channel:${msg.channelId}`).emit('messageEdited', { message: updated, channelId: msg.channelId });

    res.json({ message: updated });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
