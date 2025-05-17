
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface BackButtonProps {
  onClick: (e: React.MouseEvent) => void;
  isBackToStore: boolean;
  isDisabled: boolean;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  onClick, 
  isBackToStore, 
  isDisabled 
}) => {
  // Safe function to handle back button click
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isDisabled) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.WARNING,
        "Clique em botão voltar bloqueado durante processamento",
        { isDisabled }
      );
      return;
    }
    
    // Log the event
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT,
      LogLevel.INFO,
      `Botão de voltar clicado ${isBackToStore ? '(para loja)' : '(passo anterior)'}`
    );
    
    // Call the event handler
    onClick(e);
  };

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleBackClick}
      className="flex items-center space-x-2 py-6"
      disabled={isDisabled}
      type="button"
    >
      <ChevronLeft className="h-4 w-4" />
      <span>
        {isBackToStore ? 'Voltar para a loja' : 'Voltar'}
      </span>
    </Button>
  );
};

export default BackButton;
