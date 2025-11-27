import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Order {
  id: string;
  valor_total: number;
  status: string;
  created_at: string;
}

const RecentSalesCard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('pedidos')
          .select('id, valor_total, status, created_at')
          .in('status', ['pago', 'video_aprovado'])
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('[RecentSalesCard] Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'text-green-600 bg-green-50';
      case 'video_aprovado':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white rounded-2xl border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-green-500" />
            Vendas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm md:text-base flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-green-500" />
          Vendas Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {orders.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500">
            Nenhuma venda recente
          </div>
        ) : (
          <>
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate('/admin/pedidos')}
                className="p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all cursor-pointer active:scale-98"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(order.valor_total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] text-gray-500">
                        {formatDistanceToNow(new Date(order.created_at), {
                          locale: ptBR,
                          addSuffix: true
                        })}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                    {order.status === 'pago' ? 'Pago' : 'Aprovado'}
                  </span>
                </div>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => navigate('/admin/pedidos')}
            >
              Ver todos
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSalesCard;
