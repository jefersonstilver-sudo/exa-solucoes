
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface CheckoutMonitorProps {
  step: number;
  cartItems: any[];
  totalPrice: number;
  paymentMethod?: string;
  userId?: string;
}

export const useCheckoutMonitor = ({
  step,
  cartItems,
  totalPrice,
  paymentMethod,
  userId
}: CheckoutMonitorProps) => {
  const location = useLocation();
  const previousStep = useRef(step);
  const sessionStartTime = useRef(Date.now());

  // Monitor step changes
  useEffect(() => {
    if (previousStep.current !== step) {
      const timeSpent = Date.now() - sessionStartTime.current;
      
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        `MEGA CHECKOUT MONITOR: Step changed from ${previousStep.current} to ${step}`,
        {
          previousStep: previousStep.current,
          currentStep: step,
          timeSpentMs: timeSpent,
          route: location.pathname,
          cartItemsCount: cartItems.length,
          totalPrice,
          paymentMethod,
          userId,
          timestamp: new Date().toISOString()
        }
      );
      
      previousStep.current = step;
      sessionStartTime.current = Date.now();
    }
  }, [step, location.pathname, cartItems.length, totalPrice, paymentMethod, userId]);

  // Monitor route changes
  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `MEGA CHECKOUT MONITOR: Route changed to ${location.pathname}`,
      {
        route: location.pathname,
        step,
        cartItemsCount: cartItems.length,
        totalPrice,
        timestamp: new Date().toISOString()
      }
    );
  }, [location.pathname, step, cartItems.length, totalPrice]);

  // Monitor page unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (cartItems.length > 0 && step < 3) {
        logCheckoutEvent(
          CheckoutEvent.DEBUG_EVENT,
          LogLevel.WARNING,
          `MEGA CHECKOUT MONITOR: User attempting to leave checkout with items in cart`,
          {
            step,
            cartItemsCount: cartItems.length,
            totalPrice,
            timestamp: new Date().toISOString()
          }
        );
        
        event.preventDefault();
        event.returnValue = 'Você tem itens no carrinho. Tem certeza que deseja sair?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cartItems.length, step, totalPrice]);

  return {
    sessionDuration: Date.now() - sessionStartTime.current
  };
};
