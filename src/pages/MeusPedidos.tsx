
import React, { useState, useEffect } from 'react';
import { CalendarClock, ShoppingBag, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from '@/hooks/useUserSession';
import Layout from '@/components/layout/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Pedido {
  id: string;
  created_at: string;
  status: string | boolean;
  valor_total: number;
  lista_paineis: string[] | null;
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
}

const MeusPedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoggedIn, user, isLoading: isSessionLoading } = useUserSession();
  const navigate = useNavigate();

  // Carrega os pedidos do usuário
  useEffect(() => {
    const fetchPedidos = async () => {
      if (isSessionLoading) return;
      
      if (!isLoggedIn || !user) {
        toast.error('Você precisa estar logado para visualizar seus pedidos');
        navigate('/login?redirect=/meus-pedidos');
        return;
      }

      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('pedidos')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Erro detalhado ao carregar pedidos:', error);
          throw error;
        }
        
        console.log("Pedidos carregados:", data);
        setPedidos(data || []);
      } catch (error: any) {
        console.error('Erro ao carregar pedidos:', error.message || error);
        toast.error('Não foi possível carregar seus pedidos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPedidos();
  }, [isLoggedIn, user, isSessionLoading, navigate]);

  // Formatador de status para exibição - agora lida com string ou boolean
  const formatStatus = (status: string | boolean) => {
    // Convertendo o status para string para garantir compatibilidade
    const statusString = String(status).toLowerCase();
    
    switch (statusString) {
      case 'pendente':
      case 'false':
        return { label: 'Pendente', color: 'bg-yellow-200 text-yellow-800' };
      case 'pago':
      case 'true':
        return { label: 'Pago', color: 'bg-green-200 text-green-800' };
      case 'cancelado':
        return { label: 'Cancelado', color: 'bg-red-200 text-red-800' };
      default:
        return { label: statusString || 'Desconhecido', color: 'bg-gray-200 text-gray-800' };
    }
  };

  // Formatador de data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isSessionLoading || (isLoading && isLoggedIn)) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indexa-purple mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Carregando seus pedidos...</h2>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <ShoppingBag className="mr-2 h-8 w-8 text-indexa-purple" />
            Meus Pedidos
          </h1>
          <p className="text-gray-600 mt-2">
            Confira o histórico e status de todas as suas campanhas
          </p>
        </motion.div>

        {pedidos.length === 0 && !isLoading ? (
          <Card className="p-8 text-center">
            <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-gray-500" />
            </div>
            <h2 className="text-xl font-medium mb-2">Nenhum pedido encontrado</h2>
            <p className="text-gray-500 mb-6">
              Você ainda não realizou nenhum pedido em nossa plataforma.
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={() => navigate('/paineis-digitais/loja')}
                className="bg-indexa-purple hover:bg-indexa-purple/90"
              >
                Explorar Painéis
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID do Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Qtd. Painéis</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.map((pedido) => {
                    const status = formatStatus(pedido.status);
                    const paineisList = Array.isArray(pedido.lista_paineis) ? pedido.lista_paineis : [];
                    
                    return (
                      <TableRow key={pedido.id}>
                        <TableCell className="font-medium">
                          {pedido.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          R$ {pedido.valor_total?.toFixed(2).replace('.', ',') || '0,00'}
                        </TableCell>
                        <TableCell>
                          {pedido.plano_meses} {pedido.plano_meses === 1 ? 'mês' : 'meses'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center">
                            <CalendarClock className="h-4 w-4 mr-1 text-gray-500" />
                            <span>
                              {formatDate(pedido.data_inicio)} - {formatDate(pedido.data_fim)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {paineisList.length}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/pedido-confirmado?id=${pedido.id}`)}
                          >
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default MeusPedidos;
