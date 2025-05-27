
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface PixExpiredStateProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

const PixExpiredState = ({ onRefresh, isRefreshing }: PixExpiredStateProps) => {
  return (
    <div className="flex flex-col items-center space-y-6 p-6 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="h-8 w-8 text-orange-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-orange-800">QR Code Expirado</h3>
          <p className="text-sm text-orange-600">
            Este QR code não é mais válido. Gere um novo para continuar.
          </p>
        </div>
      </div>
      
      <Button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3"
      >
        {isRefreshing ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Gerando novo QR...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Gerar Novo QR Code
          </>
        )}
      </Button>
      
      <div className="text-xs text-gray-500 text-center">
        <p>• QR codes PIX são válidos por 10 minutos</p>
        <p>• Você pode gerar quantos QR codes precisar</p>
        <p>• O pagamento é instantâneo após o escaneamento</p>
      </div>
    </div>
  );
};

export default PixExpiredState;
