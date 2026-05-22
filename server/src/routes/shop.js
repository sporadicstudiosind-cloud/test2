const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/shop/items
router.get('/items', authMiddleware, async (req, res) => {
  try {
    const items = await prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: { cost: 'asc' },
    });

    const userInventory = await prisma.userInventory.findMany({
      where: { userId: req.user.id },
      select: { shopItemId: true, equippedAt: true },
    });

    const ownedIds = new Set(userInventory.map(i => i.shopItemId));
    const equippedMap = Object.fromEntries(
      userInventory.filter(i => i.equippedAt).map(i => [i.shopItemId, true])
    );

    const enriched = items.map(item => ({
      ...item,
      owned: ownedIds.has(item.id),
      equipped: equippedMap[item.id] || false,
    }));

    res.json({ items: enriched, userPoints: req.user.points });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/shop/buy/:itemId
router.post('/buy/:itemId', authMiddleware, async (req, res) => {
  try {
    const item = await prisma.shopItem.findUnique({ where: { id: req.params.itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.points < item.cost) return res.status(400).json({ error: 'Insufficient points' });

    const existing = await prisma.userInventory.findUnique({
      where: { userId_shopItemId: { userId: req.user.id, shopItemId: item.id } },
    });
    if (existing) return res.status(400).json({ error: 'Already owned' });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: { points: { decrement: item.cost } },
      }),
      prisma.userInventory.create({
        data: { userId: req.user.id, shopItemId: item.id },
      }),
    ]);

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { points: true },
    });

    res.json({ success: true, newPoints: updatedUser.points });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/shop/equip/:itemId
router.post('/equip/:itemId', authMiddleware, async (req, res) => {
  try {
    const item = await prisma.shopItem.findUnique({ where: { id: req.params.itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const inv = await prisma.userInventory.findUnique({
      where: { userId_shopItemId: { userId: req.user.id, shopItemId: item.id } },
    });
    if (!inv) return res.status(403).json({ error: 'Item not owned' });

    // Unequip other items of same type
    const userInventory = await prisma.userInventory.findMany({
      where: { userId: req.user.id },
      include: { shopItem: true },
    });
    const sameType = userInventory.filter(i => i.shopItem.type === item.type && i.shopItemId !== item.id);
    await Promise.all(
      sameType.map(i =>
        prisma.userInventory.update({
          where: { id: i.id },
          data: { equippedAt: null },
        })
      )
    );

    await prisma.userInventory.update({
      where: { userId_shopItemId: { userId: req.user.id, shopItemId: item.id } },
      data: { equippedAt: new Date() },
    });

    // Apply theme/background to user profile
    if (item.type === 'THEME') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { appTheme: item.assetUrl },
      });
    } else if (item.type === 'BACKGROUND') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { cardBgUrl: item.assetUrl },
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/shop/inventory
router.get('/inventory', authMiddleware, async (req, res) => {
  try {
    const inventory = await prisma.userInventory.findMany({
      where: { userId: req.user.id },
      include: { shopItem: true },
      orderBy: { purchasedAt: 'desc' },
    });
    res.json({ inventory });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
