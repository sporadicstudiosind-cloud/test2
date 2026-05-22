const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

const channelSelect = {
  id: true, name: true, description: true, icon: true,
  bgImageUrl: true, isVoice: true, isPrivate: true, tags: true, createdAt: true,
  _count: { select: { members: true } },
};

// GET /api/channels - list all channels user is member of
router.get('/', authMiddleware, async (req, res) => {
  try {
    const memberships = await prisma.channelMember.findMany({
      where: { userId: req.user.id },
      include: { channel: { select: channelSelect } },
      orderBy: { channel: { name: 'asc' } },
    });

    // Get unread counts
    const channelIds = memberships.map(m => m.channelId);
    const unreadCounts = await Promise.all(
      memberships.map(async (m) => {
        const count = await prisma.channelMessage.count({
          where: {
            channelId: m.channelId,
            createdAt: { gt: m.lastRead },
            userId: { not: req.user.id },
          },
        });
        return { channelId: m.channelId, unread: count };
      })
    );

    const unreadMap = Object.fromEntries(unreadCounts.map(u => [u.channelId, u.unread]));

    const channels = memberships.map(m => ({
      ...m.channel,
      lastRead: m.lastRead,
      unread: unreadMap[m.channelId] || 0,
    }));

    res.json({ channels });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/channels/all - list all public channels (for discovery)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const channels = await prisma.channel.findMany({
      where: { isPrivate: false },
      select: channelSelect,
      orderBy: { name: 'asc' },
    });
    res.json({ channels });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/channels - create channel
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, isVoice, tags } = req.body;
    if (!name) return res.status(400).json({ error: 'Channel name required' });

    const channel = await prisma.channel.create({
      data: {
        name: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        isVoice: Boolean(isVoice),
        tags: JSON.stringify(tags || []),
        members: { create: { userId: req.user.id } },
      },
      select: channelSelect,
    });

    res.json({ channel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/channels/:id/join
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    await prisma.channelMember.upsert({
      where: { userId_channelId: { userId: req.user.id, channelId: req.params.id } },
      update: {},
      create: { userId: req.user.id, channelId: req.params.id },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/channels/:id/read - mark channel as read
router.post('/:id/read', authMiddleware, async (req, res) => {
  try {
    await prisma.channelMember.update({
      where: { userId_channelId: { userId: req.user.id, channelId: req.params.id } },
      data: { lastRead: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/channels/:id/messages
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { cursor, limit = 50 } = req.query;
    const take = Math.min(parseInt(limit), 100);

    const messages = await prisma.channelMessage.findMany({
      where: {
        channelId: req.params.id,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        user: {
          select: { id: true, username: true, pfpUrl: true, appTheme: true },
        },
        reactions: {
          include: {
            user: { select: { id: true, username: true } },
          },
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

module.exports = router;
