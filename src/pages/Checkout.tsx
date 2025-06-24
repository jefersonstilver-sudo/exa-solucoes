
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useUserSession } from '@/hooks/useUserSession';
import PaymentGateway from '@/components/checkout/payment/PaymentGateway';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: isSessionLoading } = useUserSession();
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get order ID from URL params
  const orderId = searchParams.get('pedido') || searchParams.get('order');

  useEffect(() => {
    if (!isSessionLoading && !user) {
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout');
      return;
    }

    if (user && orderId) {
      loadOrderData();
    } else if (user && !orderId) {
      // If no order ID, redirect to create order or show error
      toast.error("Pedido não encontrado");
      navigate('/checkout/resumo');
    }
  }, [user, orderId, isSessionLoading, navigate]);

  const loadOrderData = async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      console.log("🔍 [Checkout] Carregando dados do pedido:", orderId);

      const { data: pedido, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !pedido) {
        throw new Error("Pedido não encontrado");
      }

      console.log("✅ [Checkout] Pedido carregado:", {
        id: pedido.id,
        status: pedido.status,
        valor_total: pedido.valor_total
      });

      setOrderData(pedido);

      // If already paid, redirect to confirmation
      if (pedido.status === 'pago' || pedido.status === 'pago_pendente_video') {
        toast.success("Pedido já foi pago!");
        navigate(`/pedido-confirmado?id=${pedido.id}`);
        return;
      }

    } catch (error: any) {
      console.error("❌ [Checkout] Erro ao carregar pedido:", error);
      toast.error(`Erro: ${error.message}`);
      navigate('/checkout/resumo');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPaymentStatus = async () => {
    if (!orderId) return;
    
    try {
      console.log("🔄 [Checkout] Atualizando status do pagamento");
      
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .select('status, log_pagamento')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      if (pedido.status === 'pago' || pedido.status === 'pago_pendente_video') {
        toast.success("Pagamento confirmado!");
        navigate(`/pedido-confirmado?id=${orderId}`);
      }

    } catch (error: any) {
      console.error("❌ [Checkout] Erro ao atualizar status:", error);
    }
  };

  if (isSessionLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Carregando dados do pagamento...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will be redirected by the effect above
  }

  if (!orderData) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
          <div className="text-center p-8 bg-white rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold text-red-800 mb-4">Pedido não encontrado</h2>
            <p className="text-red-600 mb-6">Não foi possível carregar os dados do seu pedido.</p>
            <button 
              onClick={() => navigate('/checkout/resumo')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Voltar ao Resumo
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PaymentGateway
        orderId={orderData.id}
        totalAmount={orderData.valor_total}
        onRefreshStatus={refreshPaymentStatus}
        userId={user.id}
      />
    </Layout>
  );
};

export default Checkout;
