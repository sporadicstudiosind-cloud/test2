const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Seed achievements
  const achievements = [
    { title: 'First Words', description: 'Send your first message', milestoneCount: 1, pointReward: 10, icon: '💬' },
    { title: 'Getting Started', description: 'Send 10 messages', milestoneCount: 10, pointReward: 25, icon: '🚀' },
    { title: 'Chatterbox', description: 'Send 20 messages', milestoneCount: 20, pointReward: 50, icon: '🗣️' },
    { title: 'Conversationalist', description: 'Send 30 messages', milestoneCount: 30, pointReward: 75, icon: '💡' },
    { title: 'Active Member', description: 'Send 50 messages', milestoneCount: 50, pointReward: 100, icon: '⭐' },
    { title: 'Dedicated', description: 'Send 75 messages', milestoneCount: 75, pointReward: 150, icon: '🌟' },
    { title: 'Century Club', description: 'Send 100 messages', milestoneCount: 100, pointReward: 250, icon: '💯' },
    { title: 'Enthusiast', description: 'Send 150 messages', milestoneCount: 150, pointReward: 400, icon: '🔥' },
    { title: 'Legend', description: 'Send 200 messages', milestoneCount: 200, pointReward: 600, icon: '👑' },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { id: ach.title.replace(/\s+/g, '-').toLowerCase() },
      update: {},
      create: { id: ach.title.replace(/\s+/g, '-').toLowerCase(), ...ach },
    });
  }

  // Seed default channels
  const channels = [
    { id: 'general', name: 'general', description: 'General discussion for everyone' },
    { id: 'announcements', name: 'announcements', description: 'Important server updates' },
    { id: 'random', name: 'random', description: 'Off-topic fun' },
    { id: 'media', name: 'media', description: 'Share images, GIFs, and videos' },
    { id: 'voice-lounge', name: 'voice-lounge', description: 'Hang out in voice', isVoice: true },
  ];

  for (const ch of channels) {
    await prisma.channel.upsert({
      where: { id: ch.id },
      update: {},
      create: ch,
    });
  }

  // Seed demo shop items
  const shopItems = [
    { name: 'Aurora Background', description: 'A stunning aurora borealis theme', type: 'BACKGROUND', cost: 200, assetUrl: '/uploads/shop/aurora.jpg' },
    { name: 'Cosmic Purple', description: 'Deep space purple vibes', type: 'THEME', cost: 150, assetUrl: 'cosmic-purple' },
    { name: 'Ocean Depths', description: 'Calming deep ocean gradient', type: 'BACKGROUND', cost: 250, assetUrl: '/uploads/shop/ocean.jpg' },
    { name: 'Neon Synthwave', description: 'Retro 80s neon aesthetic', type: 'THEME', cost: 300, assetUrl: 'neon-synthwave' },
    { name: 'Forest Mist', description: 'Peaceful forest morning', type: 'BACKGROUND', cost: 175, assetUrl: '/uploads/shop/forest.jpg' },
    { name: 'Cherry Blossom', description: 'Elegant pink blossom theme', type: 'THEME', cost: 200, assetUrl: 'cherry-blossom' },
  ];

  for (const item of shopItems) {
    await prisma.shopItem.upsert({
      where: { id: item.name.replace(/\s+/g, '-').toLowerCase() },
      update: {},
      create: { id: item.name.replace(/\s+/g, '-').toLowerCase(), ...item },
    });
  }

  console.log('✅ Database seeded successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());
