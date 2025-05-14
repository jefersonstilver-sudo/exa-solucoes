
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';

interface PanelDebugActionsProps {
  cartItemsCount: number;
  onProceedToCheckout: () => void;
  directGoToCheckout: (e: React.MouseEvent) => void;
}

const PanelDebugActions: React.FC<PanelDebugActionsProps> = ({
  cartItemsCount,
  onProceedToCheckout,
  directGoToCheckout
}) => {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center">
        <span className="text-xs text-gray-500 mr-1">v1.2</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {}}
          className="h-7 text-xs flex items-center"
        >
          <Bug className="h-3 w-3 mr-1" />
          Diagnóstico
        </Button>
      </div>
      
      {cartItemsCount > 0 && (
        <div className="flex gap-2">
          <Button 
            size="sm"
            variant="default"
            onClick={onProceedToCheckout}
            className="text-xs"
          >
            Checkout padrão
          </Button>
          <Button 
            size="sm"
            variant="outline"
            onClick={directGoToCheckout}
            className="text-xs"
          >
            Checkout direto
          </Button>
          <Button 
            size="sm"
            variant="destructive"
            onClick={() => {
              logCheckoutEvent(
                CheckoutEvent.NAVIGATE_TO_PLAN,
                LogLevel.DEBUG,
                "Navegação forçada via window.location"
              );
              logNavigation('/selecionar-plano', 'location', true);
              window.location.href = '/selecionar-plano';
            }}
            className="text-xs"
          >
            Navegação forçada
          </Button>
        </div>
      )}
    </div>
  );
};

export default PanelDebugActions;
