import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Check, Zap, Palette, Image, Star } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../../store';
import { shopApi } from '../../api';
import toast from 'react-hot-toast';

const TYPE_ICONS = { THEME: <Palette className="w-4 h-4" />, BACKGROUND: <Image className="w-4 h-4" /> };
const TYPE_LABELS = { THEME: 'Theme', BACKGROUND: 'Background' };

const THEME_PREVIEWS = {
  'cosmic-purple': { bg: '#0d0818', accent: '#a855f7', label: 'Cosmic Purple' },
  'neon-synthwave': { bg: '#0a0014', accent: '#ec4899', label: 'Neon Synthwave' },
  'cherry-blossom': { bg: '#1a0a10', accent: '#f472b6', label: 'Cherry Blossom' },
  'ocean-depths': { bg: '#040c18', accent: '#0ea5e9', label: 'Ocean Depths' },
};

export default function ShopModal() {
  const { toggleShop, user, setUser } = useStore();
  const [filter, setFilter] = useState('ALL');
  const [purchasing, setPurchasing] = useState(null);
  const qc = useQueryClient();

  const { data, refetch } = useQuery({
    queryKey: ['shop'],
    queryFn: () => shopApi.getItems().then(r => r.data),
  });

  const items = (data?.items || []).filter(i => filter === 'ALL' || i.type === filter);
  const userPoints = user?.points || 0;

  const handleBuy = async (item) => {
    if (userPoints < item.cost) {
      toast.error('Not enough points!');
      return;
    }
    setPurchasing(item.id);
    try {
      const res = await shopApi.buy(item.id);
      setUser({ ...user, points: res.data.newPoints });
      await refetch();
      toast.success(`Purchased "${item.name}"! 🎉`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Purchase failed');
    }
    setPurchasing(null);
  };

  const handleEquip = async (item) => {
    try {
      await shopApi.equip(item.id);
      await refetch();

      if (item.type === 'THEME') {
        setUser({ ...user, appTheme: item.assetUrl });
        document.documentElement.setAttribute('data-theme', item.assetUrl);
        toast.success(`Theme "${item.name}" equipped!`);
      } else {
        setUser({ ...user, cardBgUrl: item.assetUrl });
        toast.success(`Background "${item.name}" equipped!`);
      }
    } catch {
      toast.error('Failed to equip');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
         onClick={toggleShop}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
        style={{ background: 'var(--nexus-surface)', border: '1px solid var(--nexus-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
             style={{ borderBottom: '1px solid var(--nexus-border)', background: 'var(--nexus-elevated)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, var(--nexus-accent), #06b6d4)' }}>
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: 'var(--nexus-text)' }}>The Shop</h2>
              <p className="text-xs" style={{ color: 'var(--nexus-muted)' }}>Spend your points on exclusive themes & backgrounds</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                 style={{ background: 'color-mix(in srgb, var(--nexus-accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--nexus-accent) 30%, transparent)' }}>
              <Zap className="w-4 h-4" style={{ color: 'var(--nexus-accent)' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--nexus-accent)' }}>{userPoints} pts</span>
            </div>
            <button onClick={toggleShop} style={{ color: 'var(--nexus-muted)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-6 py-3 flex-shrink-0"
             style={{ borderBottom: '1px solid var(--nexus-border)' }}>
          {['ALL', 'THEME', 'BACKGROUND'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: filter === f ? 'var(--nexus-accent)' : 'var(--nexus-elevated)',
                color: filter === f ? 'white' : 'var(--nexus-muted)',
              }}
            >
              {f === 'ALL' ? 'All Items' : TYPE_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
          {items.map((item, i) => (
            <ShopItem
              key={item.id}
              item={item}
              userPoints={userPoints}
              onBuy={handleBuy}
              onEquip={handleEquip}
              purchasing={purchasing === item.id}
              index={i}
            />
          ))}
          {items.length === 0 && (
            <div className="col-span-2 text-center py-16">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--nexus-muted)' }} />
              <p style={{ color: 'var(--nexus-muted)' }}>No items available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 text-xs text-center flex-shrink-0"
             style={{ borderTop: '1px solid var(--nexus-border)', color: 'var(--nexus-muted)' }}>
          Earn points by sending messages and unlocking achievements
        </div>
      </motion.div>
    </div>
  );
}

function ShopItem({ item, userPoints, onBuy, onEquip, purchasing, index }) {
  const themePreview = THEME_PREVIEWS[item.assetUrl];
  const canAfford = userPoints >= item.cost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: 'var(--nexus-elevated)', border: '1px solid var(--nexus-border)' }}
    >
      {/* Preview */}
      <div className="relative h-32 overflow-hidden">
        {item.type === 'BACKGROUND' && item.assetUrl.startsWith('/') ? (
          <img src={item.assetUrl} alt="" className="w-full h-full object-cover" />
        ) : themePreview ? (
          <div className="w-full h-full flex items-center justify-center"
               style={{ background: themePreview.bg }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: themePreview.accent }}>
              <Palette className="w-4 h-4 text-white" />
            </div>
            <div className="absolute bottom-2 left-2 flex gap-1">
              {[themePreview.accent, 'white', 'rgba(255,255,255,0.3)'].map((c, i) => (
                <div key={i} className="w-4 h-4 rounded-full" style={{ background: c }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center"
               style={{ background: 'var(--nexus-surface)' }}>
            <ShoppingBag className="w-8 h-8 opacity-30" style={{ color: 'var(--nexus-muted)' }} />
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
             style={{ background: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)' }}>
          {TYPE_ICONS[item.type]}
          {TYPE_LABELS[item.type]}
        </div>

        {item.owned && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
               style={{ background: 'var(--nexus-online)' }}>
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--nexus-text)' }}>{item.name}</h3>
          {item.description && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--nexus-muted)' }}>{item.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
            <span className="font-bold text-sm" style={{ color: '#f59e0b' }}>{item.cost} pts</span>
          </div>

          {item.owned ? (
            item.equipped ? (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                    style={{ background: 'color-mix(in srgb, var(--nexus-online) 15%, transparent)', color: 'var(--nexus-online)' }}>
                Equipped
              </span>
            ) : (
              <button
                onClick={() => onEquip(item)}
                className="nexus-btn text-xs py-1.5 px-3"
              >
                Equip
              </button>
            )
          ) : (
            <button
              onClick={() => onBuy(item)}
              disabled={!canAfford || purchasing}
              className="text-xs py-1.5 px-3 rounded-xl font-semibold transition-all"
              style={{
                background: canAfford ? 'var(--nexus-accent)' : 'var(--nexus-surface)',
                color: canAfford ? 'white' : 'var(--nexus-muted)',
                cursor: canAfford ? 'pointer' : 'not-allowed',
              }}
            >
              {purchasing ? '...' : !canAfford ? 'Too expensive' : 'Buy'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
