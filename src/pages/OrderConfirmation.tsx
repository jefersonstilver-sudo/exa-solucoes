
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ClientOnly } from '@/components/ui/client-only';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { useOrderCreation } from '@/hooks/payment/useOrderCreation';
import { markPaymentAsProcessed } from '@/services/mercadopagoService';

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createCampaignsAfterPayment } = useOrderCreation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  const orderId = searchParams.get('id');
  const status = searchParams.get('status') || 'approved'; // Default to approved for testing
  
  useEffect(() => {
    if (!orderId) {
      toast({
        title: "Erro na confirmação",
        description: "ID do pedido não encontrado",
        variant: "destructive",
      });
      navigate('/paineis-digitais/loja');
      return;
    }
    
    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        
        // Fetch order details from Supabase
        const { data: order, error } = await supabase
          .from('pedidos')
          .select('*, users:client_id(email, id)')
          .eq('id', orderId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!order) {
          throw new Error('Pedido não encontrado');
        }
        
        setOrderDetails(order);
        
        // Process post-payment actions
        if (status === 'approved') {
          await handleApprovedPayment(order);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        toast({
          title: "Erro ao carregar detalhes do pedido",
          description: "Não foi possível carregar as informações do pedido",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderDetails();
    
    // Limpar o carrinho após confirmação do pedido
    if (status === 'approved') {
      try {
        localStorage.removeItem('indexa_cart');
        localStorage.removeItem('selectedPlan');
      } catch (e) {
        console.error('Erro ao limpar carrinho:', e);
      }
    }
  }, [orderId, status, toast, navigate]);
  
  const handleApprovedPayment = async (order: any) => {
    try {
      // Verificar se o pagamento já foi processado
      const isProcessed = localStorage.getItem(`payment_processed_${orderId}`) === 'true';
      
      if (!isProcessed) {
        // Criar campanhas
        await createCampaignsAfterPayment(orderId, order.users.id);
        
        // Marcar como processado
        localStorage.setItem(`payment_processed_${orderId}`, 'true');
        markPaymentAsProcessed(orderId);
        
        console.log('Campanhas criadas com sucesso para o pedido:', orderId);
      } else {
        console.log('Pagamento já processado anteriormente:', orderId);
      }
    } catch (error) {
      console.error('Erro ao processar pós-pagamento:', error);
    }
  };
  
  const getStatusInfo = () => {
    switch(status) {
      case 'approved':
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          title: "Pagamento aprovado!",
          description: "Seu pagamento foi processado com sucesso.",
          color: "bg-green-50 border-green-100"
        };
      case 'pending':
        return {
          icon: <Clock className="w-12 h-12 text-yellow-500" />,
          title: "Pagamento pendente",
          description: "Seu pagamento está sendo processado. Avisaremos quando for confirmado.",
          color: "bg-yellow-50 border-yellow-100"
        };
      case 'rejected':
        return {
          icon: <AlertCircle className="w-12 h-12 text-red-500" />,
          title: "Pagamento recusado",
          description: "Houve um problema com seu pagamento. Por favor, tente novamente.",
          color: "bg-red-50 border-red-100"
        };
      default:
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          title: "Pedido registrado",
          description: "Seu pedido foi registrado em nosso sistema.",
          color: "bg-blue-50 border-blue-100"
        };
    }
  };
  
  const statusInfo = getStatusInfo();

  return (
    <Layout>
      <ClientOnly>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 py-12 max-w-4xl"
        >
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="h-10 w-10 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className={`rounded-lg p-6 ${statusInfo.color} shadow-sm`}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    {statusInfo.icon}
                  </div>
                  <div className="text-center md:text-left">
                    <h1 className="text-2xl font-bold mb-2">{statusInfo.title}</h1>
                    <p className="text-gray-700">{statusInfo.description}</p>
                    
                    {orderDetails && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">
                          Pedido #{orderId?.substring(0, 8)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Detalhes do pedido */}
              {orderDetails && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Detalhes do pedido</h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Data do pedido</h3>
                        <p className="text-gray-900">{new Date(orderDetails.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Valor total</h3>
                        <p className="text-gray-900 font-semibold">
                          R$ {orderDetails.valor_total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Período da campanha</h3>
                      <p className="text-gray-900">
                        {new Date(orderDetails.data_inicio).toLocaleDateString()} a {new Date(orderDetails.data_fim).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Detalhes da campanha</h3>
                      <ul className="mt-2 divide-y divide-gray-200">
                        <li className="py-3 flex items-center justify-between">
                          <span className="text-gray-800">Plano</span>
                          <span className="font-medium">{orderDetails.plano_meses} {orderDetails.plano_meses === 1 ? 'mês' : 'meses'}</span>
                        </li>
                        <li className="py-3 flex items-center justify-between">
                          <span className="text-gray-800">Quantidade de painéis</span>
                          <span className="font-medium">{orderDetails.lista_paineis.length}</span>
                        </li>
                        <li className="py-3 flex items-center justify-between">
                          <span className="text-gray-800">Status do pedido</span>
                          <span className={`font-medium ${
                            status === 'approved' ? 'text-green-600' : 
                            status === 'pending' ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {status === 'approved' ? 'Aprovado' : 
                             status === 'pending' ? 'Pendente' : 
                             'Recusado'}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Próximos passos */}
              {status === 'approved' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Próximos passos</h2>
                  
                  <ol className="space-y-4">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-900 font-medium">Pedido confirmado</p>
                        <p className="text-gray-600">Seu pedido foi confirmado e registrado em nossa plataforma.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 bg-blue-100 rounded-full p-1">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-900 font-medium">Campanhas criadas</p>
                        <p className="text-gray-600">Suas campanhas foram criadas para os painéis selecionados.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 bg-purple-100 rounded-full p-1">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-900 font-medium">Próximo passo: Envio do vídeo</p>
                        <p className="text-gray-600">
                          Agora você precisa enviar o vídeo que será exibido nos painéis.
                          Acesse sua conta para fazer o upload do vídeo.
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
              )}
              
              <div className="flex justify-center space-x-4 pt-4">
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => navigate('/paineis-digitais/loja')}
                >
                  Voltar à loja
                </Button>
                
                {status === 'approved' && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/minha-conta')}
                  >
                    Gerenciar campanhas <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </ClientOnly>
    </Layout>
  );
}
