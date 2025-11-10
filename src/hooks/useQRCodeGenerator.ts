import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export const useQRCodeGenerator = (url: string) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;

    const generateQR = async () => {
      setLoading(true);
      try {
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        setQrCodeUrl(qrDataUrl);
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [url]);

  return { qrCodeUrl, loading };
};
