import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, ExternalLink, DollarSign, Calendar, ShoppingCart, TrendingUp, Building2 } from 'lucide-react';
import { Contact } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

interface TabPedidosProps {
  contact: Contact;
}

interface Pedido {
  id: string;
  nome_pedido: string | null;
  valor_total: number;
  status: string;
  created_at: string;
  data_inicio: string | null;
  data_fim: string | null;
  plano_meses: number | null;
  lista_predios: string[] | null;
  metodo_pagamento: string | null;
  contrato_status: string | null;
}

export const TabPedidos: React.FC<TabPedidosProps> = ({ contact }) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInvestido: 0,
    totalPedidos: 0,
    ticketMedio: 0,
    pedidosAtivos: 0
  });

  useEffect(() => {
    fetchPedidos();
  }, [contact.id, contact.telefone, contact.email]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const phone = contact.telefone?.replace(/\D/g, '') || '';
      const email = contact.email || '';
      
      // Buscar pedidos por email ou telefone do contato
      let query = supabase
        .from('pedidos')
        .select('id, nome_pedido, valor_total, status, created_at, data_inicio, data_fim, plano_meses, lista_predios, metodo_pagamento, contrato_status, email')
        .order('created_at', { ascending: false });

      const { data, error } = await query.limit(100);

      if (error) throw error;
      
      // Filtrar por email do contato
      const filteredPedidos = (data || []).filter(pedido => {
        if (email && pedido.email && pedido.email.toLowerCase() === email.toLowerCase()) {
          return true;
        }
        return false;
      });
      
      setPedidos(filteredPedidos);
      
      // Calcular estatísticas
      const aprovados = filteredPedidos.filter(p => 
        p.status === 'aprovado' || p.status === 'concluido' || p.status === 'ativo'
      );
      const totalInvestido = aprovados.reduce((sum, p) => sum + (p.valor_total || 0), 0);
      const ativos = filteredPedidos.filter(p => p.status === 'ativo' || p.status === 'aprovado').length;
      
      setStats({
        totalInvestido,
        totalPedidos: filteredPedidos.length,
        ticketMedio: filteredPedidos.length > 0 ? totalInvestido / filteredPedidos.length : 0,
        pedidosAtivos: ativos
      });
      
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aprovado':
      case 'ativo':
      case 'concluido':
        return 'bg-green-100 text-green-700';
      case 'pendente':
      case 'aguardando':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelado':
      case 'bloqueado':
        return 'bg-red-100 text-red-700';
      case 'expirado':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const handleViewPedido = (pedidoId: string) => {
    navigate(buildPath(`pedidos/${pedidoId}`));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
              <CardContent className="p-3">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="py-8">
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Investido</p>
                <p className="text-base font-bold text-green-600">
                  R$ {stats.totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Pedidos</p>
                <p className="text-base font-bold">{stats.totalPedidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <p className="text-base font-bold">
                  R$ {stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pedidos Ativos</p>
                <p className="text-base font-bold">{stats.pedidosAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header com botão */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Histórico de Pedidos</p>
                <p className="text-xs text-muted-foreground">{pedidos.length} pedido(s) encontrado(s)</p>
              </div>
            </div>
            <Button size="sm" className="h-8" onClick={() => navigate(buildPath('pedidos/novo'))}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Novo Pedido
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="p-0">
          {pedidos.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum pedido encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Este contato ainda não tem pedidos registrados
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewPedido(pedido.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Package className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {pedido.nome_pedido || `Pedido #${pedido.id.slice(0, 8)}`}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(pedido.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        {pedido.plano_meses && (
                          <span>{pedido.plano_meses} meses</span>
                        )}
                        {pedido.lista_predios && pedido.lista_predios.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {pedido.lista_predios.length} prédio(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(pedido.status)}>
                      {pedido.status}
                    </Badge>
                    <p className="font-bold text-sm min-w-[80px] text-right">
                      R$ {(pedido.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabPedidos;
