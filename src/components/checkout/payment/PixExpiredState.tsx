
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PixExpiredStateProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

const PixExpiredState = ({ onRefresh, isRefreshing }: PixExpiredStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 border border-orange-200 bg-orange-50 rounded-lg">
      <AlertTriangle className="h-8 w-8 text-orange-500 mb-2" />
      <p className="text-sm text-center text-gray-700 mb-1">
        QR Code expirado
      </p>
      <p className="text-xs text-center text-gray-500">
        O tempo para pagamento expirou. Por favor, gere um novo QR code.
      </p>
      <Button 
        onClick={onRefresh} 
        variant="outline" 
        className="mt-4"
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Gerando novo QR...' : 'Gerar novo QR code'}
      </Button>
    </div>
  );
};

export default PixExpiredState;
