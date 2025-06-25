
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useUserSession } from '@/hooks/useUserSession';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/priceUtils';

const PaymentMethod = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserSession();
  const [pedidoData, setPedidoData] = useState<any>(null);
  const [isProcessingPix, setIsProcessingPix] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error("Você precisa estar logado");
      navigate('/login');
      return;
    }

    const loadPedidoData = async () => {
      const pedidoId = localStorage.getItem('current_pedido_id');
      
      if (!pedidoId) {
        toast.error("Pedido não encontrado. Refaça o processo.");
        navigate('/checkout/resumo');
        return;
      }

      try {
        const { data: pedido, error } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', pedidoId)
          .single();

        if (error || !pedido) {
          throw new Error('Pedido não encontrado');
        }

        setPedidoData(pedido);
      } catch (error) {
        console.error('Erro ao carregar pedido:', error);
        toast.error("Erro ao carregar dados do pedido");
        navigate('/checkout/resumo');
      } finally {
        setLoading(false);
      }
    };

    loadPedidoData();
  }, [isLoggedIn, navigate]);

  const handlePixPayment = async () => {
    if (!pedidoData || !user?.id) return;

    setIsProcessingPix(true);

    try {
      console.log('🎯 [PaymentMethod] Iniciando pagamento PIX:', {
        pedidoId: pedidoData.id,
        valorTotal: pedidoData.valor_total,
        userEmail: user.email
      });

      // Chamar edge function para processar PIX
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          pedido_id: pedidoData.id,
          total_amount: pedidoData.valor_total,
          payment_method: 'pix',
          user_email: user.email || 'cliente@exemplo.com'
        }
      });

      if (error) {
        throw new Error(`Erro na função: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar pagamento PIX');
      }

      console.log('✅ [PaymentMethod] PIX gerado com sucesso:', data);

      // Navegar para página de pagamento PIX com os dados
      navigate(`/pix-payment?pedido=${pedidoData.id}`);

    } catch (error: any) {
      console.error('❌ [PaymentMethod] Erro no PIX:', error);
      toast.error(`Erro ao processar PIX: ${error.message}`);
    } finally {
      setIsProcessingPix(false);
    }
  };

  const handleBack = () => {
    navigate('/checkout/resumo');
  };

  const valorPix = pedidoData ? pedidoData.valor_total * 0.95 : 0; // 5% desconto
  const desconto = pedidoData ? pedidoData.valor_total - valorPix : 0;

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
            <p className="text-gray-600">Carregando dados do pedido...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

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
              Escolha o método de pagamento
            </h1>
            <p className="text-gray-600">
              Selecione como você deseja pagar seu pedido
            </p>
          </motion.div>

          {/* Resumo do pedido */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border p-6 mb-8"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Resumo do Pedido</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Valor original:</span>
                <span className="font-medium">{formatCurrency(pedidoData?.valor_total || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plano:</span>
                <span className="font-medium">{pedidoData?.plano_meses || 1} {pedidoData?.plano_meses === 1 ? 'mês' : 'meses'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Painéis:</span>
                <span className="font-medium">{pedidoData?.lista_paineis?.length || 0} painéis</span>
              </div>
            </div>
          </motion.div>

          {/* Métodos de pagamento */}
          <div className="space-y-4 mb-8">
            
            {/* PIX */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg border overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                      <svg viewBox="0 0 512 512" className="h-6 w-6 text-white" fill="currentColor">
                        <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">PIX</h3>
                      <p className="text-sm text-gray-600">Pagamento instantâneo</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(valorPix)}
                    </div>
                    {desconto > 0 && (
                      <div className="text-sm text-green-600">
                        Economize {formatCurrency(desconto)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 text-green-800">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="font-medium">5% de desconto no PIX</span>
                  </div>
                  <ul className="mt-2 text-sm text-green-700 space-y-1">
                    <li>• Aprovação instantânea</li>
                    <li>• QR Code válido por 5 minutos</li>
                    <li>• Confirmação automática</li>
                  </ul>
                </div>

                <Button
                  onClick={handlePixPayment}
                  disabled={isProcessingPix}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 text-lg font-bold rounded-xl shadow-xl"
                  size="lg"
                >
                  {isProcessingPix ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 512 512" className="h-5 w-5 mr-2" fill="currentColor">
                        <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
                      </svg>
                      Pagar com PIX
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Cartão de Crédito - Em breve */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-100 rounded-xl shadow-lg border overflow-hidden opacity-50"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-400 rounded-2xl flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-700">Cartão de Crédito</h3>
                      <p className="text-sm text-gray-500">Em breve disponível</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-600">
                      {formatCurrency(pedidoData?.valor_total || 0)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Em até 12x sem juros
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Botão voltar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isProcessingPix}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Resumo</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentMethod;
