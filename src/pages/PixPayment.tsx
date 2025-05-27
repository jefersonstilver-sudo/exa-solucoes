
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { usePixPayment } from '@/hooks/payment/usePixPayment';
import PixPaymentLoading from '@/components/checkout/payment/PixPaymentLoading';
import PixPaymentError from '@/components/checkout/payment/PixPaymentError';
import PixPaymentContent from '@/components/checkout/payment/PixPaymentContent';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

const PixPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const pedidoId = searchParams.get('pedido');
  const { isLoading, error, paymentData, refreshPaymentStatus } = usePixPayment(pedidoId);
  
  // Log para depuração na montagem do componente
  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      "PixPayment page mounted - SISTEMA CORRIGIDO",
      { pedidoId, timestamp: new Date().toISOString() }
    );
    
    console.log("[PIX Payment] SISTEMA CORRIGIDO - Page initialized with pedidoId:", pedidoId);
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
  
  // Log de mudanças de estado
  useEffect(() => {
    console.log("[PIX Payment] SISTEMA CORRIGIDO - State updated:", { 
      isLoading, 
      hasError: !!error, 
      hasPaymentData: !!paymentData,
      status: paymentData?.status
    });
    
    if (error) {
      console.error("[PIX Payment] Error:", error);
    }
    
    if (paymentData) {
      console.log("[PIX Payment] SISTEMA CORRIGIDO - Payment data received:", {
        status: paymentData.status,
        paymentId: paymentData.paymentId,
        hasQRCode: !!paymentData.qrCodeBase64
      });
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
