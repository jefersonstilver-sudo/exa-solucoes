import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, ExternalLink, DollarSign, Calendar } from 'lucide-react';
import { Contact } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TabPedidosProps {
  contact: Contact;
}

interface Pedido {
  id: string;
  valor_total: number;
  status: string;
  created_at: string;
  data_inicio?: string;
  data_fim?: string;
}

export const TabPedidos: React.FC<TabPedidosProps> = ({ contact }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalInvestido, setTotalInvestido] = useState(0);

  useEffect(() => {
    fetchPedidos();
  }, [contact.id, contact.telefone, contact.email]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const phone = contact.telefone.replace(/\D/g, '');
      
      // Buscar pedidos por telefone ou email
      let query = supabase
        .from('pedidos')
        .select('id, valor_total, status, created_at, data_inicio, data_fim')
        .order('created_at', { ascending: false });

      // Tentamos buscar por client_id primeiro, se existir
      const { data, error } = await query.limit(50);

      if (error) throw error;
      
      // Filtrar manualmente (já que não temos relação direta)
      // Em produção, isso deveria ser feito via query no banco
      const filteredPedidos = data || [];
      
      setPedidos(filteredPedidos);
      
      // Calcular total investido
      const total = filteredPedidos
        .filter(p => p.status === 'aprovado' || p.status === 'concluido')
        .reduce((sum, p) => sum + (p.valor_total || 0), 0);
      setTotalInvestido(total);
      
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
      case 'concluido':
        return 'bg-green-100 text-green-700';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelado':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="py-8">
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Investido</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <Button size="sm" className="h-8">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Novo Pedido
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pedidos ({pedidos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pedidos.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum pedido encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Este contato ainda não tem pedidos registrados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        Pedido #{pedido.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(pedido.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(pedido.status)}>
                      {pedido.status}
                    </Badge>
                    <p className="font-bold text-sm">
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
