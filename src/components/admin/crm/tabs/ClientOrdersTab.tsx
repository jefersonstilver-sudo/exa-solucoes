import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Calendar, DollarSign, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientOrdersTabProps {
  orders: {
    total_orders: number;
    total_spent: number;
    orders: Array<{
      id: string;
      status: string;
      valor_total: number;
      created_at: string;
      data_inicio?: string;
      data_fim?: string;
      lista_predios?: string[];
      plano_meses?: number;
    }>;
  };
}

export function ClientOrdersTab({ orders }: ClientOrdersTabProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pago: { label: 'Pago', variant: 'default' },
      ativo: { label: 'Ativo', variant: 'default' },
      pago_pendente_video: { label: 'Aguardando Vídeo', variant: 'secondary' },
      video_aprovado: { label: 'Vídeo Aprovado', variant: 'default' },
      video_enviado: { label: 'Vídeo Enviado', variant: 'secondary' },
      cancelado: { label: 'Cancelado', variant: 'destructive' },
    };

    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (orders.total_orders === 0) {
    return (
      <Card className="p-12 text-center">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Este cliente ainda não realizou nenhum pedido</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total de Pedidos</p>
              <p className="text-3xl font-bold">{orders.total_orders}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(orders.total_spent)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-3">
        {orders.orders.map((order) => (
          <Card key={order.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pedido</p>
                  <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="font-semibold">{formatCurrency(order.valor_total)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Criado em</p>
                    <p className="font-medium">{formatDate(order.created_at)}</p>
                  </div>
                </div>

                {order.plano_meses && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Plano</p>
                      <p className="font-medium">{order.plano_meses} meses</p>
                    </div>
                  </div>
                )}
              </div>

              {order.data_inicio && order.data_fim && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Período: {formatDate(order.data_inicio)} até {formatDate(order.data_fim)}
                  </p>
                </div>
              )}

              {order.lista_predios && order.lista_predios.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {order.lista_predios.length} prédio(s) selecionado(s)
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
