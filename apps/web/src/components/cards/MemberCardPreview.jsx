import React from 'react';
import { CreditCard, User, Calendar, Shield } from 'lucide-react';

const CARD_TYPE_STYLES = {
  standard: { bg: 'from-slate-800 to-slate-900', badge: 'bg-blue-500', label: 'STANDARD' },
  premium: { bg: 'from-amber-800 to-amber-950', badge: 'bg-amber-500', label: 'PREMIUM' },
  vip: { bg: 'from-purple-800 to-purple-950', badge: 'bg-purple-500', label: 'VIP' },
};

const STATUS_COLORS = {
  active: 'text-emerald-400',
  expired: 'text-red-400',
  lost: 'text-orange-400',
  replaced: 'text-yellow-400',
  cancelled: 'text-gray-400',
};

const STATUS_LABELS = {
  active: 'ACTIVE',
  expired: 'EXPIRÉE',
  lost: 'PERDUE',
  replaced: 'REMPLACÉE',
  cancelled: 'ANNULÉE',
};

const MemberCardPreview = ({ card, memberName, showDetails = true }) => {
  const style = CARD_TYPE_STYLES[card?.card_type] || CARD_TYPE_STYLES.standard;
  const statusColor = STATUS_COLORS[card?.status] || 'text-gray-400';
  const statusLabel = STATUS_LABELS[card?.status] || card?.status;

  if (!card) {
    return (
      <div className="w-full max-w-sm mx-auto aspect-[1.585] rounded-2xl bg-muted/30 border-2 border-dashed border-border flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-bold">Aucune carte</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-sm mx-auto aspect-[1.585] rounded-2xl bg-gradient-to-br ${style.bg} p-5 flex flex-col justify-between relative overflow-hidden shadow-xl`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-tr-full" />

      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-white/60 font-medium">ALIKA MOBILITY</p>
            <p className="text-lg font-black text-white tracking-wider mt-0.5">CARTE MEMBRE</p>
          </div>
          <span className={`${style.badge} text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>
            {style.label}
          </span>
        </div>
      </div>

      <div className="relative z-10 space-y-1.5">
        <p className="text-xl font-bold text-white">{memberName || '---'}</p>
        <p className="text-sm font-mono text-white/70 tracking-wider">
          {card.card_number || '---'}
        </p>
      </div>

      {showDetails && (
        <div className="relative z-10 flex justify-between items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-white/60">
              <Calendar className="w-3 h-3" />
              <span>Émis: {card.issued_date || '---'}</span>
            </div>
            {card.expiry_date && (
              <div className="flex items-center gap-1.5 text-[10px] text-white/60">
                <Calendar className="w-3 h-3" />
                <span>Expire: {card.expiry_date}</span>
              </div>
            )}
          </div>
          <span className={`text-xs font-bold ${statusColor}`}>{statusLabel}</span>
        </div>
      )}
    </div>
  );
};

export default MemberCardPreview;
