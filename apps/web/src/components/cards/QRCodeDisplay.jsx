import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const VERIFY_BASE_URL = 'https://alikamobility.alika-konnect.com/verify/card';

const QRCodeDisplay = ({ cardNumber, verifyUrl: propVerifyUrl, size = 200, showUrl = true }) => {
  if (!cardNumber && !propVerifyUrl) {
    return (
      <div className="flex items-center justify-center bg-muted/30 rounded-2xl border-2 border-dashed border-border" style={{ width: size, height: size }}>
        <p className="text-xs text-muted-foreground text-center px-2">Aucun QR disponible</p>
      </div>
    );
  }

  const verifyUrl = propVerifyUrl || `${VERIFY_BASE_URL}/${cardNumber}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-2xl shadow-lg">
        <QRCodeSVG
          value={verifyUrl}
          size={size - 32}
          level="M"
          includeMargin={false}
        />
      </div>
      {showUrl && (
        <p className="text-xs text-muted-foreground font-mono text-center break-all max-w-full">
          {verifyUrl}
        </p>
      )}
    </div>
  );
};

export default QRCodeDisplay;
