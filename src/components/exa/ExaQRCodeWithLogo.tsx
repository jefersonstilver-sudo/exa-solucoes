import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import UnifiedLogo from '@/components/layout/UnifiedLogo';

interface ExaQRCodeWithLogoProps {
  url?: string;
  size?: number;
  className?: string;
}

const ExaQRCodeWithLogo: React.FC<ExaQRCodeWithLogoProps> = ({
  url = window.location.origin + '/exa',
  size = 200,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current) return;

      try {
        // Generate QR code on canvas
        await QRCode.toCanvas(canvasRef.current, url, {
          width: size,
          margin: 2,
          color: {
            dark: '#1a1a2e', // Dark color for QR code
            light: '#ffffff' // Light background
          },
          errorCorrectionLevel: 'H' // High error correction for logo overlay
        });
        setQrCodeGenerated(true);
      } catch (error) {
        console.error('Erro ao gerar QR code:', error);
      }
    };

    generateQRCode();
  }, [url, size]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* QR Code Canvas */}
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-white/20 shadow-lg"
        style={{ 
          filter: 'drop-shadow(0 10px 30px rgba(139, 92, 246, 0.3))',
        }}
      />
      
      {/* Logo Overlay */}
      {qrCodeGenerated && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
          style={{
            width: size * 0.25,
            height: size * 0.25,
          }}
        >
          <UnifiedLogo 
            size="custom" 
            variant="dark"
            className="w-full h-full"
            linkTo=""
          />
        </div>
      )}
    </div>
  );
};

export default ExaQRCodeWithLogo;