
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';
import { forceNavigate } from '@/services/navigationService';

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
  // Added a handler for the debug button
  const handleOpenDebug = () => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      "Diagnostic button clicked"
    );
  };

  // Specific handler for forced navigation
  const handleForcedNavigation = () => {
    logCheckoutEvent(
      CheckoutEvent.NAVIGATE_TO_PLAN,
      LogLevel.DEBUG,
      "Forced navigation via window.location"
    );
    // Use 'location' as specific navigation type
    logNavigation('/selecionar-plano', 'location', true);
    // Use the forceNavigate function for consistency
    forceNavigate('/selecionar-plano');
  };
  
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center">
        <span className="text-xs text-gray-500 mr-1">v1.3</span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleOpenDebug}
          className="h-7 text-xs flex items-center"
        >
          <Bug className="h-3 w-3 mr-1" />
          Diagnostics
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
            Standard Checkout
          </Button>
          <Button 
            size="sm"
            variant="outline"
            onClick={directGoToCheckout}
            className="text-xs"
          >
            Direct Checkout
          </Button>
          <Button 
            size="sm"
            variant="destructive"
            onClick={handleForcedNavigation}
            className="text-xs"
          >
            Forced Navigation
          </Button>
        </div>
      )}
    </div>
  );
};

export default PanelDebugActions;
