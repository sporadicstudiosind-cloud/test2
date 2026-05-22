const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/search?q=keyword&hasLink=true&from=username
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q, hasLink, from, channelId, limit = 30 } = req.query;
    const take = Math.min(parseInt(limit), 100);

    if (!q) return res.status(400).json({ error: 'Query required' });

    const fromUser = from
      ? await prisma.user.findUnique({ where: { username: from }, select: { id: true } })
      : null;

    const linkRegex = /(https?:\/\/[^\s]+)/;

    const channelMessages = await prisma.channelMessage.findMany({
      where: {
        content: { contains: q },
        ...(fromUser ? { userId: fromUser.id } : {}),
        ...(channelId ? { channelId } : {}),
        ...(hasLink === 'true' ? { content: { contains: 'http' } } : {}),
      },
      include: {
        user: { select: { id: true, username: true, pfpUrl: true } },
        channel: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    const dmMessages = await prisma.directMessage.findMany({
      where: {
        content: { contains: q },
        OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
        ...(fromUser ? { senderId: fromUser.id } : {}),
      },
      include: {
        sender: { select: { id: true, username: true, pfpUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { bio: { contains: q } },
        ],
      },
      select: { id: true, username: true, pfpUrl: true, bio: true },
      take: 10,
    });

    res.json({
      channelMessages: channelMessages.map(m => ({ ...m, type: 'channel' })),
      dmMessages: dmMessages.map(m => ({ ...m, type: 'dm' })),
      users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
