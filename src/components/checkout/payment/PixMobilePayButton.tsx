
import React from 'react';
import { Button } from '@/components/ui/button';

interface PixMobilePayButtonProps {
  onClick: () => Promise<void>;
  isProcessing: boolean;
}

const PixMobilePayButton = ({ onClick, isProcessing }: PixMobilePayButtonProps) => {
  return (
    <div className="mt-6">
      <Button
        onClick={onClick}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-md flex items-center justify-center"
        data-testid="pay-with-pix-button"
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <span className="mr-2">Processando...</span>
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </>
        ) : (
          <>
            <span className="mr-2">Abrir App do Banco para Pagar</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default PixMobilePayButton;
