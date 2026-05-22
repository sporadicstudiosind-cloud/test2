import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

// Simple link preview - shows URL info nicely
export default function LinkPreview({ url }) {
  const [meta, setMeta] = useState(null);
  const [failed, setFailed] = useState(false);

  // Extract domain for display
  const domain = (() => {
    try { return new URL(url).hostname.replace('www.', ''); }
    catch { return url; }
  })();

  // Detect known sites for better previews
  const isYoutube = url.includes('youtube.com/watch') || url.includes('youtu.be/');
  const isGiphy = url.includes('giphy.com');
  const isTenor = url.includes('tenor.com');
  const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);

  if (isImage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1"
      >
        <img src={url} alt="" className="max-w-xs max-h-64 rounded-xl object-contain" loading="lazy" />
      </motion.div>
    );
  }

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="link-preview flex items-center gap-3 px-3 py-2 rounded-r-xl text-sm hover:opacity-80 transition-opacity max-w-sm"
      style={{
        background: 'var(--nexus-elevated)',
        borderLeft: '3px solid var(--nexus-accent)',
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: 'var(--nexus-accent)' }}>
          {domain}
        </p>
        <p className="truncate text-xs mt-0.5" style={{ color: 'var(--nexus-muted)' }}>
          {url}
        </p>
      </div>
      <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nexus-muted)' }} />
    </motion.a>
  );
}
