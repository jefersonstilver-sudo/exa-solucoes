
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCheckout } from '@/hooks/useCheckout';
import { useUserSession } from '@/hooks/useUserSession';
import CheckoutContainer from '@/components/checkout/CheckoutContainer';
import PaymentGateway from '@/components/checkout/payment/PaymentGateway';
import Layout from '@/components/layout/Layout';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast } from 'sonner';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, isLoading: isSessionLoading, user } = useUserSession();
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Get order ID from URL params
  const orderId = searchParams.get('id') || searchParams.get('pedido');
  
  // Enhanced logging
  useEffect(() => {
    console.log("[Checkout] Component mounted with params:", { 
      orderId, 
      isLoggedIn, 
      isSessionLoading,
      userId: user?.id 
    });
    
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      "Checkout page loaded",
      { 
        orderId, 
        isLoggedIn, 
        isSessionLoading,
        userId: user?.id,
        timestamp: new Date().toISOString() 
      }
    );
  }, [orderId, isLoggedIn, isSessionLoading, user]);

  // Calculate total amount from cart or localStorage
  useEffect(() => {
    try {
      const cartItems = JSON.parse(localStorage.getItem('indexa_cart') || '[]');
      const total = cartItems.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
      setTotalAmount(total);
      
      console.log("[Checkout] Cart total calculated:", total);
    } catch (error) {
      console.error("[Checkout] Error calculating total:", error);
      setTotalAmount(0);
    }
  }, []);

  // Redirect handler with enhanced logging
  const handleRefreshStatus = async (): Promise<void> => {
    console.log("[Checkout] Refresh status called");
    // Status refresh logic will be handled by the payment component
  };

  // Authentication check with proper error handling
  if (isSessionLoading) {
    return (
      <CheckoutContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="h-8 w-8 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </CheckoutContainer>
    );
  }

  if (!isLoggedIn) {
    return null; // CheckoutContainer will handle redirect
  }

  if (!user?.id) {
    console.error("[Checkout] User authenticated but no user ID available");
    toast.error("Erro de autenticação. Tente fazer login novamente.");
    navigate('/login?redirect=/checkout');
    return null;
  }

  if (!orderId) {
    console.error("[Checkout] No order ID provided");
    toast.error("ID do pedido não encontrado");
    navigate('/');
    return null;
  }

  console.log("[Checkout] Rendering PaymentGateway with:", {
    orderId,
    totalAmount,
    userId: user.id,
    userEmail: user.email
  });

  return (
    <CheckoutContainer requireAuth={true} step={2} title="Pagamento">
      <Layout>
        <PaymentGateway
          orderId={orderId}
          totalAmount={totalAmount}
          onRefreshStatus={handleRefreshStatus}
          userId={user.id} // CRITICAL: Passar userId corretamente
        />
      </Layout>
    </CheckoutContainer>
  );
};

export default Checkout;
