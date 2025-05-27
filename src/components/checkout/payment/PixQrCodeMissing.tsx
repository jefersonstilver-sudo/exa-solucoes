
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface PixQrCodeMissingProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

const PixQrCodeMissing = ({ onRefresh, isRefreshing }: PixQrCodeMissingProps) => {
  return (
    <div className="flex flex-col items-center space-y-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-3">
        <AlertCircle className="h-8 w-8 text-blue-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-blue-800">QR Code Indisponível</h3>
          <p className="text-sm text-blue-600">
            Não foi possível carregar o QR code. Vamos gerar um novo para você.
          </p>
        </div>
      </div>
      
      <Button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3"
      >
        {isRefreshing ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Gerando QR Code...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Gerar QR Code PIX
          </>
        )}
      </Button>
      
      <div className="text-xs text-gray-500 text-center">
        <p>• Clique no botão acima para gerar seu QR code PIX</p>
        <p>• O QR code será válido por 10 minutos</p>
        <p>• Você receberá confirmação instantânea após o pagamento</p>
      </div>
    </div>
  );
};

export default PixQrCodeMissing;
