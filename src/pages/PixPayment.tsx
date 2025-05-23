import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { usePixPayment } from '@/hooks/payment/usePixPayment';
import PixPaymentLoading from '@/components/checkout/payment/PixPaymentLoading';
import PixPaymentError from '@/components/checkout/payment/PixPaymentError';
import PixPaymentContent from '@/components/checkout/payment/PixPaymentContent';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { supabase } from '@/integrations/supabase/client';

const PixPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  const pedidoId = searchParams.get('pedido');
  const { isLoading, error, paymentData, refreshPaymentStatus } = usePixPayment(pedidoId);
  
  // Log para depuração na montagem do componente
  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      "PixPayment page mounted",
      { pedidoId, timestamp: new Date().toISOString() }
    );
    
    console.log("[PIX Payment] Page initialized with pedidoId:", pedidoId);
    console.log("[PIX Payment] Initial loading state:", isLoading);
    
    // Log quando o componente for desmontado
    return () => {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        "PixPayment page unmounted",
        { pedidoId, timestamp: new Date().toISOString() }
      );
    };
  }, [pedidoId]);
  
  // Check payment status periodically with a shorter interval (5 seconds)
  useEffect(() => {
    if (!paymentData || isLoading || checkingStatus) return;
    
    // Only run automatic checks if payment is not yet approved
    if (paymentData.status !== 'approved') {
      // Set up automatic status refresh every 5 seconds instead of 10
      const intervalId = setInterval(async () => {
        setCheckingStatus(true);
        try {
          await refreshPaymentStatus();
          
          // Check if we need to redirect based on payment status
          if (paymentData.status === 'approved' && pedidoId) {
            // Save order ID to localStorage before redirecting
            localStorage.setItem('lastCompletedOrderId', pedidoId);
            clearInterval(intervalId);
            
            // Redirect to order confirmation page after a short delay
            // to allow user to see the success animation
            setTimeout(() => {
              navigate(`/pedido-confirmado?id=${pedidoId}`);
            }, 2000);
          }
        } catch (err) {
          console.error('Error refreshing payment status:', err);
        } finally {
          setCheckingStatus(false);
        }
      }, 5000); // Check every 5 seconds instead of 10
      
      // Clean up interval
      return () => clearInterval(intervalId);
    } else if (paymentData.status === 'approved' && pedidoId) {
      // If payment is already approved, redirect immediately
      localStorage.setItem('lastCompletedOrderId', pedidoId);
      
      // Small delay to show the success animation
      setTimeout(() => {
        navigate(`/pedido-confirmado?id=${pedidoId}`);
      }, 2000);
    }
  }, [paymentData, isLoading, pedidoId, navigate, refreshPaymentStatus, checkingStatus]);
  
  // Log de mudanças de estado
  useEffect(() => {
    console.log("[PIX Payment] State updated:", { 
      isLoading, 
      hasError: !!error, 
      hasPaymentData: !!paymentData,
      status: paymentData?.status
    });
    
    if (error) {
      console.error("[PIX Payment] Error:", error);
    }
    
    if (paymentData) {
      console.log("[PIX Payment] Payment data received:", {
        status: paymentData.status,
        paymentId: paymentData.paymentId,
        hasQRCode: !!paymentData.qrCodeBase64
      });
      
      // If payment is approved, update order status
      if (paymentData.status === 'approved' && pedidoId) {
        supabase
          .from('pedidos')
          .update({ status: 'pago' })
          .eq('id', pedidoId)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating order status:', error);
            } else {
              console.log('Order status updated to paid');
            }
          });
      }
    }
  }, [isLoading, error, paymentData, pedidoId]);
  
  // Back to checkout
  const handleBack = () => {
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT,
      LogLevel.INFO,
      "User clicked back to checkout",
      { from: "pix-payment", timestamp: new Date().toISOString() }
    );
    
    navigate('/checkout');
  };
  
  // Wrap refreshPaymentStatus to ensure it returns void instead of string
  const handleRefreshStatus = async () => {
    await refreshPaymentStatus();
  };
  
  // Loading state
  if (isLoading) {
    return <PixPaymentLoading />;
  }
  
  // Error state
  if (error) {
    return <PixPaymentError error={error} onBack={handleBack} />;
  }
  
  return (
    <Layout>
      {paymentData && (
        <PixPaymentContent 
          paymentData={paymentData}
          onBack={handleBack}
          onRefreshStatus={handleRefreshStatus}
          isLoading={isLoading}
          error={error}
          pedidoId={pedidoId}
        />
      )}
    </Layout>
  );
};

export default PixPayment;
