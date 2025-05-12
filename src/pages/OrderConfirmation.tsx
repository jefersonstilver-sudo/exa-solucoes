import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/priceUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, ArrowRight, Building } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import confetti from 'canvas-confetti';

interface OrderDetails {
  id: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  duracao: number;
  data_inicio: string;
  data_fim: string;
  plano_meses: number;
  panelDetails: Array<{
    id: string;
    nome: string;
    endereco: string;
    imageUrl?: string;
  }>;
}

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const orderId = searchParams.get('id');
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  // Trigger confetti effect on successful load
  useEffect(() => {
    if (!isLoading && orderDetails) {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const runConfetti = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#1E1B4B', '#00FFAB']
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#1E1B4B', '#00FFAB']
        });

        if (Date.now() < end) {
          requestAnimationFrame(runConfetti);
        }
      };

      runConfetti();
    }
  }, [isLoading, orderDetails]);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        toast({
          title: "Pedido não encontrado",
          description: "Não foi possível encontrar os detalhes do pedido.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', orderId)
          .single();
          
        if (orderError) throw orderError;
        if (!orderData) throw new Error('Pedido não encontrado');
        
        // Fetch panel details
        const panelDetails = [];
        for (const panelId of orderData.lista_paineis) {
          const { data: panelData, error: panelError } = await supabase
            .from('painels')
            .select(`
              id, 
              buildings (
                nome, 
                endereco, 
                imageUrl
              )
            `)
            .eq('id', panelId)
            .single();
            
          if (panelError) {
            console.error('Error fetching panel data:', panelError);
            // Continue to the next panel if there's an error with this one
            continue;
          }
            
          if (panelData && panelData.buildings) {
            panelDetails.push({
              id: panelData.id,
              nome: panelData.buildings.nome || 'Painel Digital',
              endereco: panelData.buildings.endereco || 'Endereço não disponível',
              imageUrl: panelData.buildings.imageUrl
            });
          } else {
            // Fallback if building data is not available
            panelDetails.push({
              id: panelId,
              nome: 'Painel Digital',
              endereco: 'Endereço não disponível',
              imageUrl: undefined
            });
          }
        }
        
        setOrderDetails({
          ...orderData,
          panelDetails
        });
      } catch (error: any) {
        console.error('Error fetching order details:', error);
        toast({
          title: "Erro ao carregar pedido",
          description: error.message,
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate, toast]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <div className="h-12 w-12 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg text-gray-600">Carregando detalhes do seu pedido...</p>
        </div>
      </Layout>
    );
  }

  if (!orderDetails) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <div className="bg-red-50 p-6 rounded-2xl max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-red-700 mb-2">Pedido não encontrado</h2>
            <p className="text-red-600 mb-4">Não foi possível encontrar os detalhes deste pedido.</p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-[#1E1B4B] hover:bg-[#1E1B4B]/90"
            >
              Voltar para Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ClientOnly>
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Pedido Confirmado!
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              Seu pedido #{orderId ? orderId.substring(0, 8) : ''} foi processado com sucesso
            </p>
          </motion.div>
          
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="lg:col-span-2 space-y-6">
              <Card className="overflow-hidden shadow-md rounded-2xl border-none">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <span className="text-2xl mr-2">📋</span> Resumo do Pedido
                  </h2>
                  
                  <div className="space-y-6">
                    {orderDetails?.panelDetails.map((panel, index) => (
                      <motion.div 
                        key={panel.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                        className="flex gap-4 pb-4 border-b border-gray-100"
                      >
                        <div className="flex-shrink-0 w-20 h-20 overflow-hidden rounded-xl bg-gray-100">
                          {panel.imageUrl ? (
                            <img 
                              src={panel.imageUrl} 
                              alt={panel.nome || 'Building image'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <Building className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <h4 className="font-medium text-gray-900">{panel.nome}</h4>
                          <p className="text-sm text-gray-500 mt-1">{panel.endereco}</p>
                          <div className="mt-2 text-sm">
                            <span className="text-[#1E1B4B] font-semibold">
                              {orderDetails?.plano_meses} {orderDetails?.plano_meses === 1 ? 'mês' : 'meses'}
                            </span>
                            <span className="text-gray-500"> • </span>
                            <span className="text-gray-600">
                              {orderDetails?.data_inicio && new Date(orderDetails.data_inicio).toLocaleDateString('pt-BR')} até {orderDetails?.data_fim && new Date(orderDetails.data_fim).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total:</span>
                      <span className="text-xl font-bold text-[#1E1B4B]">
                        {orderDetails && formatCurrency(orderDetails.valor_total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="flex justify-between gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-200 hover:bg-gray-50"
                    onClick={() => navigate('/painel-do-cliente')}
                  >
                    Ver Meus Pedidos
                  </Button>
                  
                  <Button
                    className="flex-1 bg-[#1E1B4B] hover:bg-[#1E1B4B]/90 gap-2"
                    onClick={() => navigate('/paineis-digitais/loja')}
                  >
                    Continuar Comprando
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </div>
            
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Card className="overflow-hidden shadow-md rounded-2xl border-none">
                  <div className="bg-gradient-to-r from-[#1E1B4B] to-[#2D2A6B] p-4">
                    <h3 className="text-white font-medium">Próximos Passos</h3>
                  </div>
                  
                  <CardContent className="p-5 space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1E1B4B]/10 flex items-center justify-center text-[#1E1B4B]">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Enviar seu vídeo</h4>
                        <p className="text-sm text-gray-500">
                          Faça upload do vídeo para sua campanha
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1E1B4B]/10 flex items-center justify-center text-[#1E1B4B]">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Aprovação</h4>
                        <p className="text-sm text-gray-500">
                          Revisaremos seu vídeo em até 24h
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1E1B4B]/10 flex items-center justify-center text-[#1E1B4B]">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Veiculação</h4>
                        <p className="text-sm text-gray-500">
                          Sua campanha estará no ar na data prevista
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-4 bg-green-600 hover:bg-green-700 gap-2"
                      onClick={() => navigate('/painel-do-cliente')}
                    >
                      Enviar Vídeo Agora
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
                
                <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-medium text-blue-800 flex items-center">
                    <span className="text-lg mr-2">📧</span> Email Enviado
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Um email com os detalhes do pedido foi enviado para o seu endereço de email cadastrado.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </ClientOnly>
    </Layout>
  );
}
