import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Calendar, Building, ArrowRight, Home, Clock, PanelRight, Share2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Launch confetti effect on page load
  useEffect(() => {
    const launchConfetti = () => {
      // Launch 2 confetti cannons
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6, x: 0.3 }
      });
      
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6, x: 0.7 }
        });
      }, 250);
    };
    
    // Attempt to load the canvas-confetti library dynamically
    if (typeof window !== 'undefined') {
      try {
        launchConfetti();
      } catch (err) {
        console.error("Could not load confetti effect:", err);
      }
    }
  }, []);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError("Nenhum ID de pedido fornecido");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Get pedido details
        const { data: pedidoData, error: pedidoError } = await supabase
          .from('pedidos')
          .select('*, campanhas(*)')
          .eq('id', orderId)
          .single();
          
        if (pedidoError) throw pedidoError;
        
        if (!pedidoData) {
          setError("Pedido não encontrado");
          setIsLoading(false);
          return;
        }
        
        // Get panel details for each item in the order
        const panelIds = pedidoData.lista_paineis || [];
        
        if (panelIds.length > 0) {
          const { data: painelData, error: painelError } = await supabase
            .from('painels')
            .select('*, buildings(*)')
            .in('id', panelIds);
            
          if (painelError) throw painelError;
          
          if (painelData) {
            setOrderDetails({
              ...pedidoData,
              paineis: painelData
            });
          } else {
            setOrderDetails(pedidoData);
          }
        } else {
          setOrderDetails(pedidoData);
        }
        
        setIsLoading(false);
      } catch (error: any) {
        console.error("Error fetching order details:", error);
        setError(error.message || "Erro ao buscar detalhes do pedido");
        setIsLoading(false);
        
        toast({
          variant: "destructive",
          title: "Erro ao carregar pedido",
          description: "Não foi possível carregar os detalhes do seu pedido. Por favor, tente novamente."
        });
      }
    };
    
    fetchOrderDetails();
  }, [orderId, toast]);

  // Format date to Brazilian format
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  
  // Format currency to Brazilian format
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Get plan text from months
  const getPlanText = (months: number) => {
    switch (months) {
      case 1: return "Mensal";
      case 3: return "Trimestral";
      case 6: return "Semestral";
      case 12: return "Anual";
      default: return `${months} meses`;
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center space-y-4">
            <div className="h-20 w-20 rounded-full border-4 border-r-transparent border-indexa-purple animate-spin mx-auto"></div>
            <h2 className="text-2xl font-semibold">Carregando detalhes do pedido...</h2>
            <p className="text-gray-500">Aguarde enquanto buscamos as informações do seu pedido.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <span className="rounded-full bg-red-100 p-2 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-red-600">
                    <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </span>
                Erro ao carregar pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error || "Não foi possível carregar os detalhes do pedido. Tente novamente ou entre em contato com o suporte."}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/paineis-digitais/loja')}>
                Voltar para a loja
              </Button>
              <Button onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!isLoading && !error && orderDetails) {
    return (
      <Layout>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 py-8 max-w-4xl"
        >
          {/* Success Header */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="rounded-full bg-green-100 p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Pedido Confirmado!</h1>
            <p className="text-xl text-gray-600">
              Seu pagamento foi aprovado e suas campanhas estão sendo preparadas.
            </p>
            
            <div className="mt-4 bg-indexa-purple/5 py-2 px-4 rounded-full inline-flex items-center">
              <span className="text-sm font-medium text-indexa-purple">Código do pedido: {orderId}</span>
            </div>
          </motion.div>
          
          {/* Order Summary Card */}
          <Card className="mb-8 overflow-hidden border-green-200 shadow-lg">
            <CardHeader className="bg-green-50 border-b border-green-100">
              <CardTitle className="text-xl text-green-800 flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" /> 
                Resumo do Pedido
              </CardTitle>
              <CardDescription>
                Pedido realizado em {formatDate(orderDetails.created_at)}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Campaign Details */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-indexa-purple" />
                  Detalhes da Campanha
                </h3>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Plano</p>
                      <p className="font-medium">
                        {getPlanText(orderDetails.plano_meses)}
                        <Badge className="ml-2 bg-indexa-purple">
                          {orderDetails.plano_meses} {orderDetails.plano_meses === 1 ? 'mês' : 'meses'}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Valor Total</p>
                      <p className="font-medium text-lg text-indexa-purple">
                        {formatCurrency(orderDetails.valor_total || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Início da Exibição</p>
                      <p className="font-medium">{formatDate(orderDetails.data_inicio)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Término da Exibição</p>
                      <p className="font-medium">{formatDate(orderDetails.data_fim)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Panels List */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Building className="mr-2 h-5 w-5 text-indexa-purple" />
                  Painéis Contratados ({orderDetails.paineis?.length || 0})
                </h3>
                
                <div className="space-y-3">
                  {orderDetails.paineis?.map((panel: any, index: number) => (
                    <motion.div 
                      key={panel.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * (index + 1), duration: 0.3 }}
                      className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{panel.buildings?.nome || 'Painel Digital'}</h4>
                          <p className="text-sm text-gray-600">{panel.buildings?.endereco || 'Endereço não disponível'}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {panel.modo || 'indoor'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {panel.resolucao || 'HD'}
                            </Badge>
                          </div>
                        </div>
                        <Badge className={`${panel.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {panel.status === 'online' ? 'Ativo' : 'Em preparação'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Next Steps */}
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                <h3 className="text-lg font-medium mb-4 text-blue-800 flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Próximos Passos
                </h3>
                
                <div className="space-y-4">
                  <div className="flex">
                    <div className="flex-shrink-0 bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center text-blue-600 mr-3">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">Preparação dos materiais</h4>
                      <p className="text-sm text-blue-700">
                        Nossa equipe está preparando seus materiais visuais. 
                        {orderDetails.plano_meses >= 3 && 
                          " Como parte do seu plano, você receberá vídeos profissionais."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center text-blue-600 mr-3">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">Configuração dos painéis</h4>
                      <p className="text-sm text-blue-700">
                        Os painéis serão configurados e seus anúncios entrarão em exibição 
                        conforme a data de início contratada.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center text-blue-600 mr-3">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800">Acompanhamento de performance</h4>
                      <p className="text-sm text-blue-700">
                        Você receberá relatórios periódicos sobre o desempenho de suas campanhas 
                        e poderá acompanhar os resultados no painel do cliente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-gray-50 p-6 flex flex-col space-y-4">
              <div className="w-full flex flex-col sm:flex-row gap-3">
                <Button 
                  className="bg-indexa-purple hover:bg-indexa-purple-dark flex-1"
                  onClick={() => navigate('/painel-do-cliente')}
                >
                  <PanelRight className="mr-2 h-4 w-4" />
                  Acessar Painel do Cliente
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/paineis-digitais/loja')}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Voltar para a Loja
                </Button>
              </div>
              
              <Separator />
              
              <div className="text-center">
                <Button variant="ghost" className="flex items-center">
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar pedido
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Additional Info */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Uma cópia da confirmação de pedido foi enviada para seu email.
              Em caso de dúvidas, entre em contato com nosso suporte.
            </p>
          </div>
        </motion.div>
      </Layout>
    );
  }
}
