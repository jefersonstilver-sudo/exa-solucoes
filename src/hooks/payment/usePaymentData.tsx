
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useUserSession } from '@/hooks/useUserSession';
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast } from 'sonner';
import { filterEq, unwrapData } from '@/utils/supabaseUtils';

// Define a type for the payment log data structure
interface PaymentLogData {
  payment_method?: string;
  preference_id?: string;
  payment_id?: string;
  payment_status?: string;
  pix_data?: {
    qr_code_base64?: string;
    qr_code?: string;
  };
}

interface UsePaymentDataResult {
  isLoading: boolean;
  error: string | null;
  paymentData: any | null;
  refreshPaymentStatus: () => Promise<void>;
}

export const usePaymentData = (pedidoId: string | null): UsePaymentDataResult => {
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const { isLoggedIn, isLoading: isSessionLoading, user } = useUserSession();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any | null>(null);
  
  // Fetch order data
  useEffect(() => {
    if (isSessionLoading) return;
    
    if (!isLoggedIn) {
      uiToast({
        title: "Login necessário",
        description: "Você precisa estar logado para acessar esta página",
        variant: "destructive"
      });
      navigate('/login?redirect=/checkout');
      return;
    }
    
    if (!pedidoId) {
      uiToast({
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
        
        // Fetch order data
        const { data, error } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', filterEq(pedidoId))
          .limit(1);
        
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Pedido não encontrado");
        
        const order = unwrapData(data[0]);
        if (!order) throw new Error("Erro ao processar os dados do pedido");
        
        // Verify user permission
        if (order && user && order.client_id !== user.id) {
          throw new Error("Você não tem permissão para visualizar este pedido");
        }
        
        // Process payment data - treat log_pagamento as PaymentLogData with safe typing
        const logPagamento = (order.log_pagamento || {}) as PaymentLogData;
        const paymentMethod = logPagamento.payment_method || 'credit_card';
        
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
        
        uiToast({
          title: "Erro",
          description: err.message || "Erro ao carregar dados do pagamento",
          variant: "destructive"
        });
      }
    };
    
    fetchOrderData();
  }, [isSessionLoading, isLoggedIn, pedidoId, user, navigate, uiToast]);
  
  // Update payment status
  const refreshPaymentStatus = async (): Promise<void> => {
    if (!pedidoId) return;
    
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('log_pagamento')
        .eq('id', filterEq(pedidoId))
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Pedido não encontrado");
      
      const orderData = unwrapData(data[0]);
      if (!orderData) throw new Error("Erro ao processar os dados do pedido");
      
      const logPagamento = (orderData.log_pagamento || {}) as PaymentLogData;
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
      
      // Redirect if payment approved
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
  
  return {
    isLoading,
    error,
    paymentData,
    refreshPaymentStatus
  };
};
