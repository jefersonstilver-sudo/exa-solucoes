
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, ArrowRight, Calendar, FileText, Building, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatters';
import { ClientOnly } from '@/components/ui/client-only';
import confetti from 'canvas-confetti';

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const status = searchParams.get('status') || 'approved'; // Default para testes
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [panelDetails, setPanelDetails] = useState<any[]>([]);
  
  // Efeito de confete quando a página carrega
  useEffect(() => {
    if (status === 'approved') {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 300);
    }
  }, [status]);
  
  // Carregar dados do pedido
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "ID do pedido não encontrado",
        });
        navigate('/');
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Obter dados do pedido
        const { data: pedido, error: pedidoError } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', orderId)
          .single();
          
        if (pedidoError || !pedido) {
          throw new Error('Pedido não encontrado');
        }
        
        setOrderData(pedido);
        
        // Obter detalhes dos painéis
        if (pedido.lista_paineis && pedido.lista_paineis.length > 0) {
          const { data: paineis, error: painelError } = await supabase
            .from('painels')
            .select(`
              id,
              code,
              resolucao,
              modo,
              buildings (
                id,
                nome,
                endereco,
                bairro,
                imageUrl
              )
            `)
            .in('id', pedido.lista_paineis);
            
          if (painelError) {
            console.error('Erro ao buscar detalhes dos painéis:', painelError);
          } else {
            setPanelDetails(paineis || []);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do pedido:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os dados do pedido",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderData();
  }, [orderId, toast, navigate]);
  
  const renderStatusIcon = () => {
    if (status === 'approved') {
      return <CheckCircle className="h-20 w-20 text-green-500" />;
    } else if (status === 'pending') {
      return <Clock className="h-20 w-20 text-orange-500" />;
    } else {
      return <AlertTriangle className="h-20 w-20 text-red-500" />;
    }
  };
  
  const getStatusTitle = () => {
    if (status === 'approved') {
      return "Pagamento confirmado!";
    } else if (status === 'pending') {
      return "Pagamento pendente";
    } else {
      return "Pagamento recusado";
    }
  };
  
  const getStatusDescription = () => {
    if (status === 'approved') {
      return "Seu pedido foi aprovado e suas campanhas estão sendo processadas.";
    } else if (status === 'pending') {
      return "Seu pagamento está sendo processado. Atualizaremos você assim que for confirmado.";
    } else {
      return "Houve um problema com seu pagamento. Por favor, tente novamente ou contate o suporte.";
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-12 px-4">
          <div className="flex justify-center items-center h-60">
            <div className="h-10 w-10 border-4 border-indigo-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <ClientOnly>
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            {renderStatusIcon()}
            <h1 className="text-2xl md:text-3xl font-bold mt-4">{getStatusTitle()}</h1>
            <p className="text-gray-600 mt-2">{getStatusDescription()}</p>
          </motion.div>
          
          {orderData && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-indigo-900" />
                    Resumo do Pedido #{orderId?.substring(0, 8)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Valor total:</span>
                    <span className="font-bold">{formatCurrency(orderData.valor_total)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Quantidade de painéis:</span>
                    <span>{orderData.lista_paineis?.length || 0}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Plano:</span>
                    <span>{orderData.plano_meses} {orderData.plano_meses === 1 ? 'mês' : 'meses'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold ${
                      orderData.status === 'pago' ? 'text-green-600' : 
                      orderData.status === 'pendente' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {orderData.status === 'pago' ? 'Pago' : 
                       orderData.status === 'pendente' ? 'Pendente' : orderData.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-indigo-900" />
                    Período de Veiculação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Data de início:</span>
                    <span>
                      {new Date(orderData.data_inicio).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-gray-600">Data de término:</span>
                    <span>
                      {new Date(orderData.data_fim).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              {panelDetails.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="mr-2 h-5 w-5 text-indigo-900" />
                      Painéis Adquiridos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {panelDetails.map((panel) => (
                        <li key={panel.id} className="p-3 border rounded-lg flex">
                          <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            {panel.buildings?.imageUrl ? (
                              <img 
                                src={panel.buildings.imageUrl} 
                                alt={panel.buildings.nome} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <Building className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <h4 className="font-medium">{panel.buildings?.nome || "Painel Digital"}</h4>
                            <p className="text-sm text-gray-600">{panel.buildings?.endereco || "Endereço não disponível"}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {panel.buildings?.bairro || "Local não disponível"}
                              </span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {panel.modo || "indoor"}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              
              <CardFooter className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  variant="default" 
                  className="w-full sm:w-auto"
                  onClick={() => navigate('/painel-do-cliente')}
                >
                  Ver minhas campanhas <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => navigate('/paineis-digitais/loja')}
                >
                  Voltar para a loja
                </Button>
              </CardFooter>
            </div>
          )}
        </div>
      </ClientOnly>
    </Layout>
  );
};

export default OrderConfirmation;
