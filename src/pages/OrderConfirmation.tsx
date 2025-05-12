
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronRight, Building, Calendar } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const orderId = searchParams.get('id');
    
    if (!orderId) {
      setError("ID do pedido não encontrado");
      setLoading(false);
      return;
    }
    
    const fetchOrder = async () => {
      try {
        const { data: pedido, error: pedidoError } = await supabase
          .from('pedidos')
          .select(`
            *,
            campanhas (
              id,
              data_inicio,
              data_fim,
              status,
              painel_id,
              paineis:painels (
                id,
                building_id,
                buildings (
                  id,
                  nome,
                  endereco,
                  bairro
                )
              )
            )
          `)
          .eq('id', orderId)
          .single();
          
        if (pedidoError) throw pedidoError;
        
        if (!pedido) {
          setError("Pedido não encontrado");
        } else {
          setOrder(pedido);
        }
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Erro ao carregar pedido",
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [searchParams, toast]);
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indexa-purple"></div>
          <p className="mt-4 text-muted-foreground">Carregando informações do pedido...</p>
        </div>
      </Layout>
    );
  }
  
  if (error || !order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-red-500 text-5xl mb-4">
            <span className="bg-red-100 p-3 rounded-full">❌</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Erro ao carregar pedido</h1>
          <p className="text-muted-foreground mb-6">{error || "Ocorreu um erro desconhecido"}</p>
          <Button asChild className="mt-4">
            <Link to="/paineis-digitais/loja">Voltar para loja</Link>
          </Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-12 max-w-4xl"
      >
        <div className="text-center mb-12">
          <div className="inline-block bg-green-100 p-5 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">Pedido confirmado!</h1>
          <p className="text-muted-foreground mt-2">
            Seu pagamento foi processado com sucesso. Suas campanhas já estão sendo configuradas.
          </p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Resumo do pedido</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Número do pedido</p>
                    <p className="font-medium">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">
                      <span className="inline-flex items-center bg-green-100 text-green-800 text-sm px-2.5 py-0.5 rounded-full">
                        <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                        {order.status === 'pago' ? 'Pago' : order.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor total</p>
                    <p className="font-medium">{formatCurrency(order.valor_total)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plano</p>
                    <p className="font-medium">{order.plano_meses} {order.plano_meses === 1 ? 'mês' : 'meses'}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-semibold">Campanhas criadas</h3>
                <div className="space-y-3">
                  {order.campanhas.length > 0 ? (
                    order.campanhas.map((campanha: any) => (
                      <div key={campanha.id} className="border rounded-md p-4">
                        <div className="flex items-start">
                          <Building className="h-5 w-5 mr-2 text-indexa-purple flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">{campanha.paineis.buildings.nome}</p>
                            <p className="text-sm text-muted-foreground">{campanha.paineis.buildings.endereco}, {campanha.paineis.buildings.bairro}</p>
                            <div className="flex items-center mt-2 text-sm">
                              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>
                                {formatDate(new Date(campanha.data_inicio))} a {formatDate(new Date(campanha.data_fim))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Suas campanhas serão criadas em breve.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-center mt-10 space-x-4">
          <Button asChild variant="outline">
            <Link to="/paineis-digitais/loja">
              Voltar para loja
            </Link>
          </Button>
          <Button asChild>
            <Link to="/minha-conta/campanhas">
              Ver minhas campanhas <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </Layout>
  );
};

export default OrderConfirmation;
