
import React from 'react';
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportTemplate = ({ data, orgName, dateStr }) => (
  <div 
    id="pdf-report-template" 
    style={{
      width: '800px', // A4 proportions roughly for html2canvas
      minHeight: '1131px',
      background: '#ffffff',
      color: '#1a1a1a',
      padding: '40px',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
    }}
  >
    {/* Header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #D4AF37', paddingBottom: '20px', marginBottom: '30px' }}>
      <div>
        <h1 style={{ margin: 0, color: '#0a0e27', fontSize: '28px' }}>ALIKA <span style={{ color: '#D4AF37' }}>MOBILITY</span></h1>
        <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>{orgName}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <h2 style={{ margin: 0, color: '#00D9FF', fontSize: '20px' }}>Rapport Journalier</h2>
        <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>Date: {dateStr}</p>
      </div>
    </div>

    {/* Section 1: Summary */}
    <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
      <div style={{ flex: 1, background: '#f8f9fa', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #D4AF37' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Paiements Enregistrés</p>
        <p style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: 'bold', color: '#0a0e27' }}>{data.payments.length}</p>
      </div>
      <div style={{ flex: 1, background: '#f8f9fa', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #00D9FF' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Montant Total Encaissé</p>
        <p style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: 'bold', color: '#0a0e27' }}>{data.totalAmount.toLocaleString()} XAF</p>
      </div>
    </div>

    {/* Section 2: Table */}
    <h3 style={{ color: '#0a0e27', fontSize: '18px', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Détails des Paiements</h3>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '12px' }}>
      <thead>
        <tr style={{ background: '#0a0e27', color: '#fff' }}>
          <th style={{ padding: '10px', textAlign: 'left' }}>Heure</th>
          <th style={{ padding: '10px', textAlign: 'left' }}>Membre</th>
          <th style={{ padding: '10px', textAlign: 'left' }}>Plaque</th>
          <th style={{ padding: '10px', textAlign: 'right' }}>Montant (XAF)</th>
          <th style={{ padding: '10px', textAlign: 'center' }}>Mode</th>
        </tr>
      </thead>
      <tbody>
        {data.payments.map((p, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#f8f9fa' }}>
            <td style={{ padding: '10px' }}>{new Date(p.created).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
            <td style={{ padding: '10px', fontWeight: 'bold' }}>{p.memberName}</td>
            <td style={{ padding: '10px', fontFamily: 'monospace' }}>{p.motoNumber}</td>
            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#D4AF37' }}>{p.amount.toLocaleString()}</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>{p.payment_method}</td>
          </tr>
        ))}
        {data.payments.length === 0 && (
          <tr>
            <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Aucun paiement enregistré aujourd'hui.</td>
          </tr>
        )}
      </tbody>
    </table>

    {/* Footer */}
    <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <p style={{ fontSize: '10px', color: '#999', margin: 0 }}>Généré le: {new Date().toLocaleString()}</p>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '150px', borderBottom: '1px solid #0a0e27', marginBottom: '5px', height: '40px' }}></div>
        <p style={{ fontSize: '12px', margin: 0, color: '#0a0e27' }}>Signature Administrateur</p>
      </div>
    </div>
  </div>
);

export const generateDailyReport = async (data, orgName) => {
  return new Promise((resolve, reject) => {
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      const today = new Date();
      const dateStr = today.toLocaleDateString();
      const filenameDate = today.toISOString().split('T')[0];

      const root = createRoot(container);
      root.render(<ReportTemplate data={data} orgName={orgName} dateStr={dateStr} />);

      setTimeout(async () => {
        try {
          const element = document.getElementById('pdf-report-template');
          if (!element) throw new Error("Template not rendered");

          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true
          });

          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          
          // A4 Size: 210 x 297 mm
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          
          const filename = `Rapport_${orgName.replace(/\s+/g, '_')}_${filenameDate}.pdf`;
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
      }, 800);
    } catch (error) {
      console.error("PDF Generation error:", error);
      reject(error);
    }
  });
};
