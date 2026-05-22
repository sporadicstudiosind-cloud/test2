const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { uploadPfp, uploadBg } = require('../middleware/upload');

const prisma = new PrismaClient();

// GET /api/users - list all users
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, username: true, pfpUrl: true,
        bio: true, cardBgUrl: true, appTheme: true,
        points: true, messageCount: true, createdAt: true,
      },
      orderBy: { username: 'asc' },
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/users/me - update profile (before /:id)
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const { bio, appTheme, cardBgUrl } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(bio !== undefined ? { bio } : {}),
        ...(appTheme ? { appTheme } : {}),
        ...(cardBgUrl !== undefined ? { cardBgUrl } : {}),
      },
      select: {
        id: true, email: true, username: true,
        pfpUrl: true, bio: true, cardBgUrl: true,
        appTheme: true, points: true, messageCount: true,
      },
    });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/me/pfp - upload profile picture (before /:id)
router.post('/me/pfp', authMiddleware, uploadPfp.single('pfp'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const pfpUrl = `/uploads/pfp/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { pfpUrl },
      select: { id: true, pfpUrl: true },
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/me/card-bg - upload card background (before /:id)
router.post('/me/card-bg', authMiddleware, uploadBg.single('bg'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const cardBgUrl = `/uploads/backgrounds/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { cardBgUrl },
      select: { id: true, cardBgUrl: true },
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/me/achievements (before /:id)
router.get('/me/achievements', authMiddleware, async (req, res) => {
  try {
    const achievements = await prisma.userAchievement.findMany({
      where: { userId: req.user.id },
      include: { achievement: true },
      orderBy: { unlockedAt: 'asc' },
    });
    const allAchievements = await prisma.achievement.findMany({ orderBy: { milestoneCount: 'asc' } });
    res.json({ earned: achievements, all: allAchievements });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, username: true, pfpUrl: true,
        bio: true, cardBgUrl: true, appTheme: true,
        points: true, messageCount: true, createdAt: true,
        userAchievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: 'asc' },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
