const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MILESTONES = [1, 10, 20, 30, 50, 75, 100, 150, 200];

async function checkAndAwardAchievements(userId, messageCount) {
  const newAchievements = [];

  for (const milestone of MILESTONES) {
    if (messageCount < milestone) continue;

    const achievement = await prisma.achievement.findFirst({
      where: { milestoneCount: milestone },
    });
    if (!achievement) continue;

    const existing = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
    });
    if (existing) continue;

    await prisma.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: achievement.pointReward } },
    });

    newAchievements.push({
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      pointReward: achievement.pointReward,
    });
  }

  return newAchievements;
}

module.exports = { checkAndAwardAchievements };
