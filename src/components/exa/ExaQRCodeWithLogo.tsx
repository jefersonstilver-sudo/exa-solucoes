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
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-xl z-20 border-2 border-gray-100"
          style={{
            width: size * 0.35,
            height: size * 0.35,
          }}
        >
          <img 
            src="/brand-assets/be41c92b-ba0c-4778-9a8a-905f6843f3f1.png"
            alt="EXA Publicidade Inteligente - Painéis Digitais para Elevadores em Foz do Iguaçu"
            className="w-full h-full object-contain"
            loading="lazy"
            onLoad={() => {
              console.log('✅ Logo EXA carregada com sucesso no QR code');
            }}
            onError={(e) => {
              console.error('❌ Erro ao carregar logo, usando fallback texto');
              // Secure fallback without innerHTML
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = 'flex items-center justify-center w-full h-full text-purple-600 font-bold text-sm';
                fallbackDiv.textContent = 'EXA';
                parent.appendChild(fallbackDiv);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ExaQRCodeWithLogo;
