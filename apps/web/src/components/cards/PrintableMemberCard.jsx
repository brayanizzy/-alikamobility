import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const VERIFY_BASE_URL = 'https://alikamobility.alika-konnect.com/verify/card';

const PrintableMemberCard = React.forwardRef(({ card, memberName, verifyUrl: propVerifyUrl }, ref) => {
  const verifyUrl = propVerifyUrl || (card?.card_number ? `${VERIFY_BASE_URL}/${card.card_number}` : '');

  const cardTypeStyles = {
    standard: { bg: '#1e293b', badge: '#3b82f6', label: 'STANDARD' },
    premium: { bg: '#92400e', badge: '#f59e0b', label: 'PREMIUM' },
    vip: { bg: '#581c87', badge: '#a855f7', label: 'VIP' },
  };
  const style = cardTypeStyles[card?.card_type] || cardTypeStyles.standard;

  const statusColors = {
    active: '#34d399',
    expired: '#f87171',
    lost: '#fb923c',
    replaced: '#fbbf24',
    cancelled: '#9ca3af',
  };

  return (
    <div ref={ref} className="print-card w-[340px] mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${style.bg}, #0f172a)`,
          borderRadius: '16px',
          padding: '20px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '220px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '0 0 0 100%' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '0 100% 0 0' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '10px', opacity: 0.6, fontWeight: 600, margin: 0 }}>ALIKA MOBILITY</p>
              <p style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '1px', margin: '2px 0 0 0' }}>CARTE MEMBRE</p>
            </div>
            <span style={{ background: style.badge, color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 10px', borderRadius: '999px' }}>
              {style.label}
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, margin: '16px 0' }}>
          <p style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{memberName || '---'}</p>
          <p style={{ fontSize: '13px', fontFamily: 'monospace', opacity: 0.7, letterSpacing: '1px', margin: '4px 0 0 0' }}>
            {card?.card_number || '---'}
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: '10px', opacity: 0.6, margin: 0 }}>Émis: {card?.issued_date || '---'}</p>
            {card?.expiry_date && <p style={{ fontSize: '10px', opacity: 0.6, margin: '2px 0 0 0' }}>Expire: {card.expiry_date}</p>}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: statusColors[card?.status] || '#9ca3af' }}>
            {(card?.status || '').toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
        <div style={{ background: 'white', padding: '12px', borderRadius: '12px' }}>
          {verifyUrl ? (
            <QRCodeSVG value={verifyUrl} size={120} level="M" includeMargin={false} />
          ) : (
            <div style={{ width: 120, height: 120, background: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#999' }}>
              Pas de QR
            </div>
          )}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '9px', color: '#999', marginTop: '8px', fontFamily: 'monospace' }}>
        {verifyUrl}
      </p>

      <style>{`
        @media print {
          .print-card { margin: 0 auto; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
});

PrintableMemberCard.displayName = 'PrintableMemberCard';

export default PrintableMemberCard;
