
import { useState, useEffect } from 'react';
import { findCartItems } from '@/utils/cartUtils';

interface DebugInfo {
  timestamp: string;
  cartStatus: {
    hasItems: boolean;
    itemCount: number;
    usedKey: string;
    totalPrice: number;
    items: any[];
  };
  userStatus: {
    isAuthenticated: boolean;
    userId?: string;
    email?: string;
  };
  systemStatus: {
    selectedPlan?: number;
    localStorage: Record<string, any>;
  };
}

export const usePaymentDebug = (user?: any) => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  
  const refreshDebugInfo = () => {
    const cartResult = findCartItems();
    const selectedPlan = localStorage.getItem('selectedPlan');
    
    const info: DebugInfo = {
      timestamp: new Date().toISOString(),
      cartStatus: {
        hasItems: cartResult.success && cartResult.cartItems.length > 0,
        itemCount: cartResult.cartItems.length,
        usedKey: cartResult.usedKey,
        totalPrice: cartResult.cartItems.reduce((sum, item) => sum + (item.price || 0), 0),
        items: cartResult.cartItems.map(item => ({
          id: item.id,
          panelId: item.panel?.id,
          buildingName: item.panel?.buildings?.nome,
          price: item.price,
          duration: item.duration
        }))
      },
      userStatus: {
        isAuthenticated: !!user,
        userId: user?.id,
        email: user?.email
      },
      systemStatus: {
        selectedPlan: selectedPlan ? parseInt(selectedPlan) : undefined,
        localStorage: {
          simple_cart: localStorage.getItem('simple_cart'),
          indexa_unified_cart: localStorage.getItem('indexa_unified_cart'),
          panelCart: localStorage.getItem('panelCart'),
          selectedPlan: selectedPlan
        }
      }
    };
    
    setDebugInfo(info);
    console.log("🔍 [usePaymentDebug] Debug info atualizado:", info);
  };

  useEffect(() => {
    refreshDebugInfo();
  }, [user]);

  return {
    debugInfo,
    refreshDebugInfo
  };
};
