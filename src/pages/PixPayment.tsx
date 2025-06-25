
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import PixPaymentRealtimeWrapper from '@/components/checkout/payment/PixPaymentRealtimeWrapper';
import { useUserSession } from '@/hooks/useUserSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

const PixPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserSession();
  const [pedidoData, setPedidoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const pedidoId = searchParams.get('pedido');

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error("Você precisa estar logado");
      navigate('/login');
      return;
    }

    if (!pedidoId) {
      toast.error("ID do pedido não encontrado");
      navigate('/checkout/resumo');
      return;
    }

    const loadPedidoData = async () => {
      try {
        const { data: pedido, error } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', pedidoId)
          .single();

        if (error || !pedido) {
          throw new Error('Pedido não encontrado');
        }

        // Verificar se o usuário tem permissão para acessar este pedido
        if (pedido.client_id !== user?.id) {
          throw new Error('Acesso negado a este pedido');
        }

        setPedidoData(pedido);
      } catch (error: any) {
        console.error('Erro ao carregar pedido:', error);
        toast.error(error.message || "Erro ao carregar dados do pedido");
        navigate('/anunciante/pedidos');
      } finally {
        setLoading(false);
      }
    };

    loadPedidoData();
  }, [pedidoId, isLoggedIn, user?.id, navigate]);

  const handleRefreshStatus = async () => {
    if (!pedidoId) return;

    try {
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();

      if (!error && pedido) {
        setPedidoData(pedido);
        
        if (pedido.status === 'pago') {
          toast.success('Pagamento confirmado!');
          navigate('/anunciante/pedidos');
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToOrders = () => {
    navigate('/anunciante/pedidos');
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 py-8 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="h-8 w-8 border-4 border-[#3C1361] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados do pagamento...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (!pedidoData) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 py-8 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Pedido não encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              Não foi possível encontrar os dados deste pedido.
            </p>
            <div className="space-x-4">
              <Button onClick={handleGoHome} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Início
              </Button>
              <Button onClick={handleGoToOrders}>
                Meus Pedidos
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Extrair dados PIX do log_pagamento
  const logPagamento = pedidoData.log_pagamento || {};
  const pixData = logPagamento.pixData || logPagamento.pix_data || {};

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pagamento PIX
            </h1>
            <p className="text-gray-600">
              Complete seu pagamento para ativar os painéis
            </p>
          </motion.div>

          {/* Componente principal de pagamento PIX */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PixPaymentRealtimeWrapper
              qrCodeBase64={pixData.qrCodeBase64 || logPagamento.qr_code_base64}
              qrCodeText={pixData.qrCode || pixData.qrCodeText || logPagamento.qr_code_text}
              status={pedidoData.status}
              paymentId={pedidoData.id}
              onRefreshStatus={handleRefreshStatus}
              userId={user?.id}
              pedidoId={pedidoData.id}
              valorTotal={pedidoData.valor_total}
              expiresAt={pixData.expires_at || logPagamento.expires_at}
            />
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center space-x-4 mt-8"
          >
            <Button
              variant="outline"
              onClick={handleGoToOrders}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Meus Pedidos</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleGoHome}
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Início</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default PixPayment;
