
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import PixPaymentDetails from '@/components/checkout/payment/PixPaymentDetails';
import { Button } from '@/components/ui/button';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from '@/hooks/useUserSession';

// Define types for payment related data
interface PixData {
  qr_code: string;
  qr_code_base64: string;
}

interface PaymentLog {
  payment_method: string;
  payment_status: string;
  payment_id: string;
  pix_data?: PixData;
}

const PixPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: isSessionLoading, sessionUser } = useUserSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [pedidoId, setPedidoId] = useState<string | null>(searchParams.get('pedido'));
  
  // Fetch payment data from Supabase
  const fetchPaymentData = async () => {
    if (!pedidoId) {
      setError("ID do pedido não encontrado");
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Pedido não encontrado");
      
      const pedido = data[0];
      
      // Check if user is authorized to view this payment
      if (pedido.client_id !== sessionUser?.id) {
        throw new Error("Você não tem permissão para visualizar este pagamento");
      }
      
      // Check if payment exists and is a PIX payment
      const logPagamento = pedido.log_pagamento as PaymentLog;
      
      if (!logPagamento || logPagamento.payment_method !== 'pix') {
        throw new Error("Método de pagamento inválido ou não encontrado");
      }
      
      // Set the payment data
      setPaymentData({
        pedidoId: pedido.id,
        status: logPagamento.payment_status || 'pending',
        qrCode: logPagamento.pix_data?.qr_code || '',
        qrCodeBase64: logPagamento.pix_data?.qr_code_base64 || '',
        paymentId: logPagamento.payment_id || '',
        valorTotal: pedido.valor_total
      });
      
      // If payment is already approved, redirect to confirmation page after a short delay
      if (logPagamento.payment_status === 'approved') {
        setTimeout(() => {
          navigate(`/pedido-confirmado?id=${pedido.id}`);
        }, 3000);
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error fetching payment data:", err);
      setError(err.message || "Erro ao carregar dados do pagamento");
      setIsLoading(false);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro ao carregar dados do PIX: ${err.message}`,
        { pedidoId, error: String(err) }
      );
    }
  };
  
  // Refresh the payment status
  const refreshPaymentStatus = async () => {
    if (!pedidoId) return;
    
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Pedido não encontrado");
      
      const pedido = data[0];
      const logPagamento = pedido.log_pagamento as PaymentLog;
      
      // Update local payment data
      setPaymentData(prev => ({
        ...prev,
        status: logPagamento.payment_status || 'pending',
      }));
      
      // If payment is approved, redirect to confirmation page
      if (logPagamento.payment_status === 'approved') {
        toast.success("Pagamento aprovado! Redirecionando...");
        setTimeout(() => {
          navigate(`/pedido-confirmado?id=${pedido.id}`);
        }, 1500);
      }
      
      return logPagamento.payment_status;
    } catch (err: any) {
      console.error("Error refreshing payment status:", err);
      toast.error("Erro ao atualizar status do pagamento");
      throw err;
    }
  };
  
  // Back to checkout
  const handleBack = () => {
    navigate('/checkout');
  };
  
  // Check authentication and load payment data
  useEffect(() => {
    if (isSessionLoading) return;
    
    if (!isLoggedIn) {
      navigate('/login?redirect=/checkout');
      return;
    }
    
    fetchPaymentData();
  }, [isSessionLoading, isLoggedIn, pedidoId]);
  
  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-red-700 mb-2">Erro ao carregar pagamento</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={handleBack}>Voltar para checkout</Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <ClientOnly>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center text-gray-600"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar para checkout
            </Button>
          </div>
          
          <h1 className="text-2xl font-bold mb-6 text-center">Pagamento via PIX</h1>
          
          {paymentData && (
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <PixPaymentDetails
                qrCodeBase64={paymentData.qrCodeBase64}
                qrCodeText={paymentData.qrCode}
                status={paymentData.status}
                paymentId={paymentData.paymentId}
                onRefreshStatus={refreshPaymentStatus}
              />
            </div>
          )}
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Após realizar o pagamento, você será redirecionado automaticamente para a página de confirmação.</p>
          </div>
        </div>
      </ClientOnly>
    </Layout>
  );
};

export default PixPayment;
