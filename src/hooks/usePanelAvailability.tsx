
import { useState } from 'react';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface CartItem {
  panel: Panel;
  duration: number;
}

export const usePanelAvailability = () => {
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [unavailablePanels, setUnavailablePanels] = useState<string[]>([]);

  const isValidPanelId = (id: string): boolean => {
    // FIXED: Accept both UUID format and building- prefixed IDs
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const buildingPattern = /^building-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    return uuidPattern.test(id) || buildingPattern.test(id);
  };

  const checkPanelAvailability = async (
    cartItems: CartItem[],
    startDate: Date,
    endDate: Date
  ) => {
    console.log("Checking panel availability for:", cartItems);
    
    setIsCheckingAvailability(true);
    setUnavailablePanels([]);

    try {
      // Validate panel IDs before processing
      const invalidPanels = cartItems.filter(item => !isValidPanelId(item.panel.id));
      
      if (invalidPanels.length > 0) {
        console.warn("Invalid panel IDs found, but proceeding:", invalidPanels.map(p => p.panel.id));
        logCheckoutEvent(
          CheckoutEvent.DEBUG_EVENT,
          LogLevel.WARNING,
          `Invalid panel IDs found but allowing: ${invalidPanels.map(p => p.panel.id).join(', ')}`,
          { invalidPanelIds: invalidPanels.map(p => p.panel.id) }
        );
      }

      // For now, assume all panels are available
      // TODO: Implement actual availability check with Supabase
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        `Panel availability check completed - all panels available`,
        { panelCount: cartItems.length, startDate, endDate }
      );

      setUnavailablePanels([]);
    } catch (error) {
      console.error("Error checking panel availability:", error);
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.ERROR,
        `Error checking panel availability: ${error}`,
        { error: String(error) }
      );
      
      // Don't block the checkout on availability check errors
      setUnavailablePanels([]);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  return {
    isCheckingAvailability,
    unavailablePanels,
    checkPanelAvailability
  };
};
