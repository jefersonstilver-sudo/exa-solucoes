
import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { CheckCircle, ArrowRight, FileText, Calendar, Building, Play } from 'lucide-react';

const OrderConfirmation = () => {
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const location = useLocation();
  const { toast } = useToast();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.5
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  useEffect(() => {
    const fetchOrderData = async () => {
      setIsLoading(true);
      
      try {
        // Get order ID from URL params
        const params = new URLSearchParams(location.search);
        const orderId = params.get('id');
        
        if (!orderId) {
          setError('ID do pedido não encontrado na URL');
          toast({
            variant: "destructive",
            title: "Erro",
            description: "ID do pedido não encontrado",
          });
          setIsLoading(false);
          return;
        }
        
        // Get order data from Supabase
        const { data: pedido, error: pedidoError } = await supabase
          .from('pedidos')
          .select('*, campanhas(*)')
          .eq('id', orderId)
          .single();
        
        if (pedidoError) {
          throw pedidoError;
        }
        
        if (!pedido) {
          setError('Pedido não encontrado');
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Pedido não encontrado",
          });
        } else {
          setOrderData(pedido);
        }
      } catch (error: any) {
        console.error('Error fetching order:', error);
        setError(error.message || 'Erro ao buscar dados do pedido');
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message || 'Erro ao buscar dados do pedido',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderData();
  }, [location.search, toast]);
  
  // Render loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full border-4 border-indexa-purple border-t-transparent animate-spin mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Carregando informações do pedido</h2>
            <p className="text-muted-foreground">Aguarde um momento...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-red-100 p-3 mb-4">
                <svg className="h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Erro ao carregar pedido</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button asChild>
                <Link to="/paineis-digitais/loja">Voltar para loja</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  // Render confirmation page
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Success animation */}
        <motion.div 
          className="flex flex-col items-center mb-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="rounded-full bg-green-100 p-6 mb-4 border-4 border-green-200"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
          >
            <CheckCircle className="h-16 w-16 text-green-500" />
          </motion.div>
          
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-center mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Pedido confirmado!
          </motion.h1>
          
          <motion.p 
            className="text-lg text-muted-foreground text-center max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Sua campanha foi agendada e estará no ar em breve.
          </motion.p>
        </motion.div>
        
        {orderData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Order details */}
            <motion.div 
              className="md:col-span-2 space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <h2 className="text-xl font-semibold flex items-center mb-4">
                  <FileText className="mr-2 h-5 w-5 text-indexa-purple" />
                  Detalhes do Pedido
                </h2>
                
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Número do pedido</p>
                        <p className="font-medium">{orderData.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Data</p>
                        <p className="font-medium">{new Date(orderData.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Valor total</p>
                        <p className="font-medium">{formatCurrency(orderData.valor_total)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium flex items-center">
                          <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                          {orderData.status === 'pago' ? 'Pago' : orderData.status}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Período</p>
                        <p className="font-medium flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
                          {formatDate(new Date(orderData.data_inicio))} a {formatDate(new Date(orderData.data_fim))}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Plano</p>
                        <p className="font-medium">{orderData.plano_meses} {orderData.plano_meses === 1 ? 'mês' : 'meses'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <h2 className="text-xl font-semibold flex items-center mb-4">
                  <Building className="mr-2 h-5 w-5 text-indexa-purple" />
                  Painéis Contratados
                </h2>
                
                <div className="space-y-4">
                  {Array.isArray(orderData.lista_paineis) && orderData.lista_paineis.map((panelId: string, index: number) => (
                    <Card key={panelId}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Painel #{index + 1}</h3>
                            <p className="text-sm text-muted-foreground">ID: {panelId.slice(0, 8).toUpperCase()}</p>
                          </div>
                          
                          <div className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmado
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <div className="flex justify-between items-center space-x-4 mt-8">
                  <Button variant="outline" asChild>
                    <Link to="/paineis-digitais/loja">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Voltar para loja
                    </Link>
                  </Button>
                  
                  <Button className="bg-indexa-purple hover:bg-indexa-purple-dark" asChild>
                    <Link to="/dashboard/campanhas">
                      <Play className="mr-2 h-4 w-4" />
                      Ver minhas campanhas
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Right sidebar */}
            <motion.div 
              className="md:col-span-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-indexa-purple/10 to-indexa-mint/5">
                <CardContent className="p-6 space-y-5">
                  <div className="bg-white rounded-lg p-4 border border-indexa-purple/10 shadow-sm">
                    <h3 className="font-medium mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-1.5 text-indexa-purple" />
                      Próximos passos
                    </h3>
                    
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                          <span className="text-green-700 text-sm font-medium">1</span>
                        </div>
                        <p className="text-sm"><span className="font-medium">Análise de arte:</span> Nossa equipe analisará seu vídeo em até 24h úteis</p>
                      </li>
                      
                      <li className="flex items-start">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                          <span className="text-blue-700 text-sm font-medium">2</span>
                        </div>
                        <p className="text-sm"><span className="font-medium">Agendamento:</span> Confirmaremos a data de início da sua campanha</p>
                      </li>
                      
                      <li className="flex items-start">
                        <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                          <span className="text-indigo-700 text-sm font-medium">3</span>
                        </div>
                        <p className="text-sm"><span className="font-medium">Início da exibição:</span> Sua campanha estará no ar conforme cronograma</p>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-indexa-purple/10 shadow-sm">
                    <h3 className="font-medium mb-3">Precisa de ajuda?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Nossa equipe está disponível para tirar qualquer dúvida sobre sua campanha
                    </p>
                    <Button className="w-full bg-indexa-mint text-gray-800 hover:bg-indexa-mint-dark">
                      Falar com um especialista
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
