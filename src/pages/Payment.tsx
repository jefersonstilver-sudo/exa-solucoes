
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { useUserSession } from '@/hooks/useUserSession';
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { ClientOnly } from '@/components/ui/client-only';
import PaymentGateway from '@/components/checkout/payment/PaymentGateway';

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoggedIn, isLoading: isSessionLoading, user } = useUserSession();
  
  const pedidoId = searchParams.get('pedido');
  const method = searchParams.get('method') || 'credit_card';
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any | null>(null);
  
  // Buscar dados do pedido
  useEffect(() => {
    if (isSessionLoading) return;
    
    if (!isLoggedIn) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para acessar esta página",
        variant: "destructive"
      });
      navigate('/login?redirect=/checkout');
      return;
    }
    
    if (!pedidoId) {
      toast({
        title: "Pedido não encontrado",
        description: "ID do pedido não fornecido",
        variant: "destructive"
      });
      navigate('/checkout');
      return;
    }
    
    const fetchOrderData = async () => {
      try {
        setIsLoading(true);
        
        // Buscar dados do pedido
        const { data, error } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', pedidoId)
          .limit(1);
        
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Pedido não encontrado");
        
        const order = data[0];
        
        // Verificar permissão do usuário
        if (order.client_id !== user?.id) {
          throw new Error("Você não tem permissão para visualizar este pedido");
        }
        
        // Processar dados de pagamento
        const logPagamento = order.log_pagamento || {};
        const paymentMethod = logPagamento.payment_method || method;
        
        setPaymentData({
          orderId: order.id,
          totalAmount: order.valor_total,
          preferenceId: logPagamento.preference_id || null,
          method: paymentMethod,
          pixData: paymentMethod === 'pix' && logPagamento.pix_data ? {
            qrCodeBase64: logPagamento.pix_data.qr_code_base64 || '',
            qrCode: logPagamento.pix_data.qr_code || '',
            paymentId: logPagamento.payment_id || '',
            status: logPagamento.payment_status || 'pending'
          } : null
        });
        
        setIsLoading(false);
      } catch (err: any) {
        console.error("Erro ao carregar dados do pagamento:", err);
        setError(err.message || "Erro ao carregar dados do pagamento");
        setIsLoading(false);
        
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_ERROR,
          LogLevel.ERROR,
          `Erro ao carregar dados do pagamento: ${err.message}`,
          { pedidoId, error: String(err) }
        );
        
        toast({
          title: "Erro",
          description: err.message || "Erro ao carregar dados do pagamento",
          variant: "destructive"
        });
      }
    };
    
    fetchOrderData();
  }, [isSessionLoading, isLoggedIn, pedidoId, user?.id]);
  
  // Atualizar status do pagamento
  const refreshPaymentStatus = async (): Promise<void> => {
    if (!pedidoId) return;
    
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('log_pagamento')
        .eq('id', pedidoId)
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Pedido não encontrado");
      
      const logPagamento = data[0].log_pagamento || {};
      const paymentMethod = logPagamento.payment_method || 'credit_card';
      
      if (paymentMethod === 'pix' && logPagamento.pix_data) {
        setPaymentData(prev => ({
          ...prev,
          pixData: {
            ...prev?.pixData,
            status: logPagamento.payment_status || 'pending'
          }
        }));
      }
      
      // Redirecionar se pagamento aprovado
      if (logPagamento.payment_status === 'approved') {
        toast.success("Pagamento aprovado! Redirecionando...");
        setTimeout(() => {
          navigate(`/pedido-confirmado?id=${pedidoId}`);
        }, 1500);
      }
    } catch (err: any) {
      console.error("Erro ao atualizar status do pagamento:", err);
      toast.error("Erro ao atualizar status do pagamento");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro ao atualizar status: ${err.message}`,
        { pedidoId, error: String(err) }
      );
    }
  };
  
  if (isSessionLoading || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">Erro ao carregar pagamento</h2>
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => navigate('/checkout')}
              className="mt-4"
              variant="outline"
            >
              Voltar para checkout
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <ClientOnly>
        {paymentData && (
          <PaymentGateway
            orderId={paymentData.orderId}
            totalAmount={paymentData.totalAmount}
            preferenceId={paymentData.preferenceId}
            pixData={paymentData.pixData}
            onRefreshStatus={refreshPaymentStatus}
          />
        )}
      </ClientOnly>
    </Layout>
  );
};

export default Payment;
