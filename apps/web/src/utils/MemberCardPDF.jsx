
import React from 'react';
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';

// Hidden visual component for rendering
const CardTemplate = ({ member, qrData, serialNumber, expirationDate }) => (
  <div 
    id="pdf-card-template" 
    style={{
      width: '400px',
      height: '600px',
      background: 'linear-gradient(135deg, #0a0e27 0%, #151a3a 100%)',
      color: '#ffffff',
      padding: '30px',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      border: '2px solid #D4AF37',
      borderRadius: '16px'
    }}
  >
    <div style={{ textAlign: 'center', marginBottom: '20px', width: '100%', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', paddingBottom: '15px' }}>
      <h2 style={{ margin: 0, color: '#D4AF37', fontSize: '24px', letterSpacing: '1px' }}>ALIKA MOBILITY</h2>
      <p style={{ margin: '5px 0 0', color: '#00D9FF', fontSize: '12px', textTransform: 'uppercase' }}>Carte de Membre Officielle</p>
    </div>

    {member.photoUrl ? (
      <img 
        src={member.photoUrl} 
        alt="Member" 
        style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover', border: '3px solid #00D9FF', marginBottom: '20px' }}
      />
    ) : (
      <div style={{ width: '120px', height: '120px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: '3px solid #00D9FF', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '40px', color: '#fff' }}>{member.name.charAt(0)}</span>
      </div>
    )}

    <h3 style={{ margin: '0 0 5px 0', fontSize: '22px', textAlign: 'center', color: '#fff' }}>{member.name}</h3>
    <p style={{ margin: '0 0 15px 0', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontFamily: 'monospace' }}>SN: {serialNumber}</p>

    <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: '#D4AF37', fontSize: '12px' }}>PLAQUE:</span>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{member.moto_number}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: '#D4AF37', fontSize: '12px' }}>TÉLÉPHONE:</span>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{member.phone}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: '#D4AF37', fontSize: '12px' }}>PARKING:</span>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{member.parkingName || 'N/A'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#D4AF37', fontSize: '12px' }}>EXPIRATION:</span>
        <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#00D9FF' }}>{expirationDate}</span>
      </div>
    </div>

    <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', marginTop: 'auto' }}>
      <QRCodeSVG value={qrData} size={100} level="H" />
    </div>

    <div style={{ position: 'absolute', bottom: '15px', left: '0', width: '100%', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'left' }}>
        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Délivré le: {new Date().toLocaleDateString()}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ borderBottom: '1px solid #D4AF37', paddingBottom: '2px', marginBottom: '2px' }}>
          <span style={{ fontFamily: 'cursive', fontSize: '14px', color: '#00D9FF' }}>Direction</span>
        </div>
        <p style={{ margin: 0, fontSize: '8px', color: '#D4AF37', textTransform: 'uppercase' }}>Signature Autorisée</p>
      </div>
    </div>
  </div>
);

export const generateMemberCard = async (member, qrData) => {
  return new Promise((resolve, reject) => {
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      // Generate Serial Number ALIKA-YYYYMMDD-XXXXX
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
      const serialNumber = `ALIKA-${dateStr}-${randomStr}`;

      // Expiration: 1 year from now
      const expDate = new Date(today);
      expDate.setFullYear(expDate.getFullYear() + 1);
      const expirationDate = expDate.toLocaleDateString();

      const root = createRoot(container);
      root.render(<CardTemplate member={member} qrData={qrData} serialNumber={serialNumber} expirationDate={expirationDate} />);

      setTimeout(async () => {
        try {
          const element = document.getElementById('pdf-card-template');
          if (!element) throw new Error("Template not rendered");

          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: null
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [85, 127]
          });

          pdf.addImage(imgData, 'PNG', 0, 0, 85, 127);
          
          const filename = `Carte_${member.name.replace(/\s+/g, '_')}_${today.toISOString().split('T')[0]}.pdf`;
          pdf.save(filename);

          root.unmount();
          document.body.removeChild(container);
          resolve(true);
        } catch (err) {
          console.error(err);
          root.unmount();
          document.body.removeChild(container);
          reject(err);
        }
      }, 500);
    } catch (error) {
      console.error("PDF Generation error:", error);
      reject(error);
    }
  });
};
