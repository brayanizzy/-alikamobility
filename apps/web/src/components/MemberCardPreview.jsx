import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * MemberCardPreview — Printable member card with QR code
 * 
 * Design: Physical ID card format
 * ┌─────────────────────────────────┐
 * │  [LOGO]  ASSOCIATION NAME       │
 * │                                 │
 * │  ┌──────┐   NOM COMPLET        │
 * │  │PHOTO │   Plaque: KN-1234    │
 * │  └──────┘   Tel: +243...       │
 * │                                 │
 * │  ┌─────────┐  Code:            │
 * │  │ QR CODE │  ALIKA-GOM-000245 │
 * │  └─────────┘                    │
 * │  Membre depuis: 2026-01-15     │
 * └─────────────────────────────────┘
 */
const MemberCardPreview = ({ member, orgName, qrSecret }) => {
  const cardRef = useRef(null);

  const handlePrint = () => {
    const printContents = cardRef.current?.innerHTML;
    if (!printContents) return;
    
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Carte Membre - ${member.name}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; }
            .card { 
              width: 340px; 
              border: 2px solid #1a1a2e; 
              border-radius: 16px; 
              padding: 24px; 
              background: white;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #f0f0f0; 
              padding-bottom: 12px; 
              margin-bottom: 16px; 
            }
            .header h2 { 
              margin: 0; 
              font-size: 16px; 
              color: #1a1a2e; 
              letter-spacing: 1px; 
            }
            .header p { 
              margin: 4px 0 0; 
              font-size: 11px; 
              color: #666; 
            }
            .member-info {
              display: flex;
              gap: 16px;
              margin-bottom: 16px;
            }
            .photo-placeholder {
              width: 80px;
              height: 80px;
              border-radius: 12px;
              background: #f0f0f0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              font-weight: bold;
              color: #999;
              flex-shrink: 0;
            }
            .details { flex: 1; }
            .details h3 { margin: 0 0 8px; font-size: 18px; color: #1a1a2e; }
            .details .row { 
              display: flex; 
              justify-content: space-between; 
              margin: 4px 0; 
              font-size: 12px; 
            }
            .details .label { color: #888; }
            .details .value { font-weight: bold; color: #333; }
            .qr-section {
              display: flex;
              align-items: center;
              gap: 16px;
              background: #fafafa;
              padding: 12px;
              border-radius: 12px;
              margin-bottom: 12px;
            }
            .qr-section .code { 
              font-family: monospace; 
              font-size: 13px; 
              font-weight: bold; 
              color: #1a1a2e; 
              letter-spacing: 0.5px;
            }
            .qr-section .label { font-size: 10px; color: #888; margin-bottom: 4px; }
            .footer { 
              text-align: center; 
              font-size: 10px; 
              color: #aaa; 
              border-top: 1px solid #f0f0f0; 
              padding-top: 8px; 
            }
          </style>
        </head>
        <body>
          ${printContents}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Card Preview */}
      <div ref={cardRef}>
        <div className="card" style={{
          width: '340px',
          border: '2px solid hsl(var(--border))',
          borderRadius: '16px',
          padding: '24px',
          background: 'white',
          color: '#1a1a2e',
          margin: '0 auto',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', color: '#1a1a2e', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {orgName || 'ALIKA MOBILITY'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#888' }}>CARTE DE MEMBRE</p>
          </div>

          {/* Member Info */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '12px',
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#bbb',
              flexShrink: 0,
            }}>
              {member.name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#1a1a2e' }}>{member.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '12px' }}>
                <span style={{ color: '#888' }}>Plaque</span>
                <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{member.moto_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '12px' }}>
                <span style={{ color: '#888' }}>Tél</span>
                <span style={{ fontWeight: 'bold' }}>{member.phone}</span>
              </div>
            </div>
          </div>

          {/* QR Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: '#fafafa',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '12px',
          }}>
            <QRCodeSVG value={qrSecret} size={90} level="H" />
            <div>
              <p style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>Code Membre</p>
              <p style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold', color: '#1a1a2e', letterSpacing: '0.5px' }}>
                {member.member_code}
              </p>
              {member.join_date && (
                <>
                  <p style={{ fontSize: '10px', color: '#888', marginBottom: '2px', marginTop: '8px' }}>Membre depuis</p>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>{member.join_date}</p>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: '9px', color: '#bbb', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
            Alika Mobility • Plateforme de recouvrement • alika.io
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 max-w-[340px] mx-auto">
        <button
          onClick={handlePrint}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg"
        >
          Imprimer la carte
        </button>
      </div>
    </div>
  );
};

export default MemberCardPreview;
