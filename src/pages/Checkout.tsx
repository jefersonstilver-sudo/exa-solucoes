
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
  
  // Get order ID from URL params - CORREÇÃO CRÍTICA
  const orderId = searchParams.get('id') || searchParams.get('pedido');
  
  // Enhanced logging
  useEffect(() => {
    console.log("[Checkout] CORREÇÃO DEFINITIVA: Component mounted with params:", { 
      orderId, 
      isLoggedIn, 
      isSessionLoading,
      userId: user?.id,
      urlParams: Object.fromEntries(searchParams.entries())
    });
    
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      "Checkout page loaded with orderId validation",
      { 
        orderId, 
        isLoggedIn, 
        isSessionLoading,
        userId: user?.id,
        hasOrderId: !!orderId,
        timestamp: new Date().toISOString() 
      }
    );
  }, [orderId, isLoggedIn, isSessionLoading, user, searchParams]);

  // Calculate total amount from cart or localStorage
  useEffect(() => {
    try {
      const cartItems = JSON.parse(localStorage.getItem('panelCart') || '[]');
      const total = cartItems.reduce((sum: number, item: any) => {
        const price = item.panel?.buildings?.basePrice || item.price || 250;
        return sum + price;
      }, 0);
      setTotalAmount(total);
      
      console.log("[Checkout] Cart total calculated:", { total, cartItemsCount: cartItems.length });
    } catch (error) {
      console.error("[Checkout] Error calculating total:", error);
      setTotalAmount(0);
    }
  }, []);

  // Redirect handler with enhanced logging
  const handleRefreshStatus = async (): Promise<void> => {
    console.log("[Checkout] Refresh status called for orderId:", orderId);
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
    console.log("[Checkout] User not logged in, redirecting to login");
    return null; // CheckoutContainer will handle redirect
  }

  if (!user?.id) {
    console.error("[Checkout] User authenticated but no user ID available");
    toast.error("Erro de autenticação. Tente fazer login novamente.");
    navigate('/login?redirect=/checkout');
    return null;
  }

  // CORREÇÃO CRÍTICA: Validar orderId obrigatório
  if (!orderId) {
    console.error("[Checkout] CRÍTICO: No order ID provided in URL params");
    toast.error("ID do pedido não encontrado. Redirecionando para resumo.");
    
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.ERROR,
      "Critical: No orderId found, redirecting to summary",
      { 
        currentUrl: window.location.href,
        searchParams: Object.fromEntries(searchParams.entries())
      }
    );
    
    navigate('/checkout/resumo');
    return null;
  }

  console.log("[Checkout] CORREÇÃO: Rendering PaymentGateway with orderId:", {
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
          userId={user.id}
        />
      </Layout>
    </CheckoutContainer>
  );
};

export default Checkout;
