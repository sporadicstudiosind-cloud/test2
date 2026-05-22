const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function cleanupExpiredMedia() {
  const expiryDays = parseInt(process.env.MEDIA_EXPIRY_DAYS || '7');
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - expiryDays);

  console.log(`🧹 Running media cleanup (older than ${expiryDays} days)...`);

  try {
    // Channel messages
    const channelMessages = await prisma.channelMessage.findMany({
      where: {
        mediaUrl: { not: null },
        createdAt: { lt: cutoff },
        mediaExpiredAt: null,
      },
      select: { id: true, mediaUrl: true },
    });

    for (const msg of channelMessages) {
      if (msg.mediaUrl) {
        const filePath = path.join(__dirname, '../../', msg.mediaUrl);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {}
      }
      await prisma.channelMessage.update({
        where: { id: msg.id },
        data: { mediaUrl: null, mediaExpiredAt: new Date() },
      });
    }

    // DMs
    const dmMessages = await prisma.directMessage.findMany({
      where: {
        mediaUrl: { not: null },
        createdAt: { lt: cutoff },
        mediaExpiredAt: null,
      },
      select: { id: true, mediaUrl: true },
    });

    for (const msg of dmMessages) {
      if (msg.mediaUrl) {
        const filePath = path.join(__dirname, '../../', msg.mediaUrl);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {}
      }
      await prisma.directMessage.update({
        where: { id: msg.id },
        data: { mediaUrl: null, mediaExpiredAt: new Date() },
      });
    }

    if (channelMessages.length + dmMessages.length > 0) {
      console.log(`✅ Cleaned up ${channelMessages.length + dmMessages.length} expired media files`);
    }
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

function startCleanupJob() {
  // Run daily at 3am
  cron.schedule('0 3 * * *', cleanupExpiredMedia);
  console.log('⏰ Media cleanup cron job scheduled (daily at 3am)');
}

module.exports = { startCleanupJob, cleanupExpiredMedia };
