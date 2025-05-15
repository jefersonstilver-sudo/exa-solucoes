import React from 'react';
import { Button } from '@/components/ui/button';
import CartDebugButton from '@/components/debug/CartDebugButton';

interface PanelDebugActionsProps {
  cartItemsCount: number;
  onProceedToCheckout: () => void;
  directGoToCheckout: () => void;
  onOpenDebugger: () => void;
}

const PanelDebugActions: React.FC<PanelDebugActionsProps> = ({
  cartItemsCount,
  onProceedToCheckout,
  directGoToCheckout,
  onOpenDebugger
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="space-x-2">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={onProceedToCheckout}
          disabled={cartItemsCount === 0}
        >
          Finalizar Compra
        </Button>
        
        <Button 
          variant="destructive" 
          size="sm"
          onClick={directGoToCheckout}
          disabled={cartItemsCount === 0}
        >
          Checkout Direto (Debug)
        </Button>
      </div>
      
      <div className="space-x-2">
        <CartDebugButton />
        <Button 
          variant="outline" 
          size="sm"
          onClick={onOpenDebugger}
        >
          Abrir Debugger
        </Button>
      </div>
    </div>
  );
};

export default PanelDebugActions;
