import { CartItem } from '@/types/cart';
import { PlanKey } from '@/types/checkout';
import { calculatePrice } from '@/utils/priceCalculator';
import { logSystemEvent } from '@/utils/auditLogger';

interface CouponState {
  valid: boolean;
  discountPercent: number;
  couponId: string | null;
  couponCode?: string;
}

interface TransactionSession {
  transactionId: string;
  lockedPrice: number;
  sessionData: {
    cartItems: CartItem[];
    selectedPlan: PlanKey;
    couponSnapshot: CouponState;
    timestamp: string;
  };
}

// In-memory session storage (can be enhanced with localStorage)
const activeSessions = new Map<string, TransactionSession>();

export const transactionSessionManager = {
  createTransactionSession: async (
    cartItems: CartItem[], 
    selectedPlan: PlanKey,
    couponState?: CouponState
  ): Promise<{ success: boolean; transactionId: string; price: number }> => {
    try {
      const transactionId = generateTransactionId();
      
      console.log('🔐 [TransactionSession] Criando sessão com cupom:', {
        transactionId,
        couponValid: couponState?.valid,
        couponCode: couponState?.couponCode || 'SEM CÓDIGO',
        couponDiscount: couponState?.discountPercent
      });
      
      // Calculate price with coupon applied
      const couponDiscount = couponState?.valid ? couponState.discountPercent : 0;
      const couponCode = couponState?.couponCode;
      const priceResult = calculatePrice(selectedPlan, cartItems, couponDiscount, true, couponCode); // true for PIX discount
      const lockedPrice = priceResult.finalPrice;
      
      // Create session with complete snapshot
      const session: TransactionSession = {
        transactionId,
        lockedPrice,
        sessionData: {
          cartItems: JSON.parse(JSON.stringify(cartItems)), // Deep copy
          selectedPlan,
          couponSnapshot: couponState || { valid: false, discountPercent: 0, couponId: null, couponCode: undefined },
          timestamp: new Date().toISOString()
        }
      };
      
      activeSessions.set(transactionId, session);
      
      logSystemEvent('TRANSACTION_SESSION_CREATED', {
        transactionId,
        lockedPrice,
        cartItemsCount: cartItems.length,
        selectedPlan,
        couponApplied: couponState?.valid || false,
        couponDiscount: couponDiscount,
        originalTotal: priceResult.subtotal,
        finalTotal: lockedPrice
      });
      
      return {
        success: true,
        transactionId,
        price: lockedPrice
      };
    } catch (error: any) {
      logSystemEvent('TRANSACTION_SESSION_ERROR', {
        error: error.message,
        cartItemsCount: cartItems.length,
        selectedPlan
      }, 'ERROR');
      
      return {
        success: false,
        transactionId: '',
        price: 0
      };
    }
  },

  getSession: (transactionId: string): TransactionSession | null => {
    return activeSessions.get(transactionId) || null;
  },

  updateSessionStatus: (transactionId: string, status: string, updates?: any): void => {
    const session = activeSessions.get(transactionId);
    if (session) {
      logSystemEvent('TRANSACTION_SESSION_UPDATE', {
        transactionId,
        status,
        updates: updates || {}
      });
    }
  },

  clearSession: (transactionId: string): void => {
    activeSessions.delete(transactionId);
    logSystemEvent('TRANSACTION_SESSION_CLEARED', { transactionId });
  }
};

function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}