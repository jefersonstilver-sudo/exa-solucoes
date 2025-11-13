import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  qrCodeBase64?: string;
  qrCodeText?: string;
  onRegenerate?: () => void;
}
export const QRCodeDisplay = ({
  qrCodeBase64,
  qrCodeText,
  onRegenerate
}: QRCodeDisplayProps) => {
  const [imageError, setImageError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fallbackQR, setFallbackQR] = useState<string | null>(null);
  
  // Generate fallback QR code from text if base64 fails
  useEffect(() => {
    const generateFallbackQR = async () => {
      if (qrCodeText && (imageError || !qrCodeBase64)) {
        try {
          console.log("[QRCodeDisplay] 🔄 Gerando QR Code fallback do texto PIX...");
          const qrDataUrl = await QRCode.toDataURL(qrCodeText, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          });
          setFallbackQR(qrDataUrl);
          console.log("[QRCodeDisplay] ✅ QR Code fallback gerado com sucesso");
        } catch (error) {
          console.error("[QRCodeDisplay] ❌ Erro ao gerar QR Code fallback:", error);
        }
      }
    };
    
    generateFallbackQR();
  }, [qrCodeText, imageError, qrCodeBase64]);
  console.log("[QRCodeDisplay] QR code data received:", {
    hasQRCode: !!qrCodeBase64,
    qrCodeLength: qrCodeBase64?.length,
    isDataUrl: qrCodeBase64?.startsWith('data:'),
    isBase64Only: qrCodeBase64 && !qrCodeBase64.startsWith('data:'),
    preview: qrCodeBase64 ? `${qrCodeBase64.substring(0, 100)}...` : 'Not available'
  });
  
  // Validate base64 string format
  const isValidBase64 = (str: string) => {
    if (!str || str.length === 0) return false;
    try {
      // Remove data URL prefix if present
      const base64String = str.replace(/^data:image\/[a-z]+;base64,/, '');
      // Check if it's valid base64
      return /^[A-Za-z0-9+/]*={0,2}$/.test(base64String) && base64String.length % 4 === 0;
    } catch {
      return false;
    }
  };
  
  const hasValidQRCode = !!qrCodeBase64 && !imageError && isValidBase64(qrCodeBase64);
  const handleRetry = async () => {
    setIsRetrying(true);
    setImageError(false);
    setImageLoaded(false);
    if (onRegenerate) {
      await onRegenerate();
    }
    setTimeout(() => {
      setIsRetrying(false);
    }, 2000);
  };
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("[QRCodeDisplay] Erro ao carregar QR code:", {
      error: e,
      imageSrc: (e.target as HTMLImageElement).src?.substring(0, 100) + '...'
    });
    setImageError(true);
    setImageLoaded(false);
  };
  const handleImageLoad = () => {
    console.log("[QRCodeDisplay] ✅ QR code carregado com sucesso");
    setImageLoaded(true);
    setImageError(false);
  };
  
  // Process imageSource before rendering
  if (!qrCodeBase64) {
    return <motion.div className="flex flex-col items-center" initial={{
      opacity: 0,
      scale: 0.9
    }} animate={{
      opacity: 1,
      scale: 1
    }} transition={{
      duration: 0.3
    }}>
        <div className="border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center w-64 h-64 p-6">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-500 text-center mb-4">
            Gerando QR Code PIX...
          </p>
          <div className="h-6 w-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </motion.div>;
  }
  
  // CORREÇÃO: Melhor tratamento do formato do QR Code com validação
  let imageSource = qrCodeBase64;

  // CORREÇÃO: Verificar se é base64 válido e adicionar prefixo se necessário
  if (!qrCodeBase64.startsWith('data:')) {
    // Remove any whitespace or newlines
    const cleanBase64 = qrCodeBase64.trim().replace(/\s/g, '');
    
    // Verificar se parece ser base64 válido (mais rigoroso)
    if (cleanBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
      imageSource = `data:image/png;base64,${cleanBase64}`;
      console.log("[QRCodeDisplay] ✅ Adicionado prefixo data URL ao base64 válido");
    } else {
      console.error("[QRCodeDisplay] ❌ QR Code inválido - não é base64:", {
        length: qrCodeBase64.length,
        preview: qrCodeBase64.substring(0, 100),
        hasInvalidChars: !/^[A-Za-z0-9+/=\s]*$/.test(qrCodeBase64)
      });
      // Set error state if base64 is invalid
      setImageError(true);
      return null;
    }
  } else {
    console.log("[QRCodeDisplay] ✅ QR Code já tem prefixo data URL");
  }
  
  // Use fallback QR if available
  const displaySource = fallbackQR || imageSource;
  if (imageError) {
    return <motion.div className="flex flex-col items-center" initial={{
      opacity: 0,
      scale: 0.9
    }} animate={{
      opacity: 1,
      scale: 1
    }} transition={{
      duration: 0.3
    }}>
        <div className="border-2 border-dashed border-red-200 rounded-lg bg-red-50 flex flex-col items-center justify-center w-64 h-64 p-6">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-sm text-red-600 text-center mb-4">
            Erro ao carregar QR Code
          </p>
          {onRegenerate && <Button onClick={handleRetry} disabled={isRetrying} variant="outline" size="sm" className="text-red-600 border-red-300">
              {isRetrying ? <>
                  <div className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Regenerando...
                </> : <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </>}
            </Button>}
        </div>
      </motion.div>;
  }
  
  return <motion.div className="flex flex-col items-center" initial={{
    opacity: 0,
    scale: 0.9
  }} animate={{
    opacity: 1,
    scale: 1
  }} transition={{
    duration: 0.3
  }}>
      <div className={`border-2 rounded-lg p-4 shadow-sm relative bg-white ${imageLoaded ? 'border-green-200' : 'border-gray-200'}`}>
        {!imageLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 rounded-lg">
            <div className="h-8 w-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-xs text-gray-500">Carregando QR Code...</p>
          </div>
        )}
        <img 
          src={displaySource} 
          alt="QR Code PIX" 
          className={`w-56 h-56 rounded-lg transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{
            display: imageError ? 'none' : 'block',
            backgroundColor: 'transparent',
            objectFit: 'contain'
          }}
        />
      </div>
      
      {imageLoaded && (
        <motion.div 
          className="mt-3 flex items-center space-x-2" 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CheckCircle className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-600 font-medium">
            {fallbackQR ? 'QR Code gerado (fallback)' : 'QR Code PIX válido'}
          </p>
        </motion.div>
      )}
      
      
    </motion.div>;
};