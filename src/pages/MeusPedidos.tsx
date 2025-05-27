
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserSession } from '@/hooks/useUserSession';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Calendar,
  CreditCard,
  Package,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Pedido {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  plano_meses: number;
  lista_paineis: string[];
  data_inicio: string;
  data_fim: string;
}

const MeusPedidos = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserSession();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (user?.id) {
      fetchPedidos();
    }
  }, [user, isLoggedIn, navigate]);

  const fetchPedidos = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPedidos(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendente': { label: 'Pendente', variant: 'secondary' as const },
      'pago': { label: 'Pago', variant: 'default' as const },
      'ativo': { label: 'Ativo', variant: 'default' as const },
      'pago_pendente_video': { label: 'Aguardando Vídeo', variant: 'secondary' as const },
      'video_enviado': { label: 'Vídeo Enviado', variant: 'secondary' as const },
      'video_aprovado': { label: 'Aprovado', variant: 'default' as const },
      'video_rejeitado': { label: 'Rejeitado', variant: 'destructive' as const },
      'cancelado': { label: 'Cancelado', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, variant: 'secondary' as const };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C1361]"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center">
            <ShoppingBag className="mr-2 h-6 w-6" />
            <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
          </div>

          {pedidos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum pedido encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Você ainda não fez nenhum pedido
                </p>
                <Button onClick={() => navigate('/planos')}>
                  Fazer Primeiro Pedido
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pedidos.map((pedido, index) => (
                <motion.div
                  key={pedido.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Pedido #{pedido.id.slice(-8)}
                        </CardTitle>
                        {getStatusBadge(pedido.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Data do Pedido</p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(pedido.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <CreditCard className="mr-2 h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Valor Total</p>
                            <p className="text-sm text-gray-600">
                              R$ {pedido.valor_total.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Package className="mr-2 h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Plano</p>
                            <p className="text-sm text-gray-600">
                              {pedido.plano_meses} {pedido.plano_meses === 1 ? 'mês' : 'meses'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">
                          Painéis ({pedido.lista_paineis?.length || 0})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {pedido.lista_paineis?.slice(0, 3).map((painel, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {painel}
                            </Badge>
                          ))}
                          {(pedido.lista_paineis?.length || 0) > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(pedido.lista_paineis?.length || 0) - 3} mais
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <div className="text-sm text-gray-600">
                          Período: {format(new Date(pedido.data_inicio), 'dd/MM/yy', { locale: ptBR })} - {format(new Date(pedido.data_fim), 'dd/MM/yy', { locale: ptBR })}
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 h-3 w-3" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default MeusPedidos;
