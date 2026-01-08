import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, CheckCircle, Clock, AlertCircle, PlayCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientCRM } from '@/types/crm';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PedidosTabProps {
  clients: ClientCRM[];
}

interface Pedido {
  id: string;
  client_id: string;
  status: string;
  data_inicio: string;
  data_fim: string;
  created_at: string;
}

const PedidosTab: React.FC<PedidosTabProps> = ({ clients }) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, client_id, status, data_inicio, data_fim, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPedidos((data as Pedido[]) || []);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-600', icon: <Clock className="w-3 h-3" /> },
      active: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-600', icon: <PlayCircle className="w-3 h-3" /> },
      completed: { label: 'Concluído', className: 'bg-blue-100 text-blue-600', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-600', icon: <AlertCircle className="w-3 h-3" /> },
    };
    const { label, className, icon } = config[status] || config.pending;
    return (
      <Badge variant="outline" className={`${className} flex items-center gap-1`}>
        {icon}
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar pedido..."
          className="pl-10 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {pedidos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum pedido encontrado</p>
          </div>
        ) : (
          pedidos.map((pedido) => (
            <div
              key={pedido.id}
              onClick={() => navigate(buildPath(`pedidos/${pedido.id}`))}
              className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(pedido.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {pedido.data_inicio && pedido.data_fim && (
                      <>
                        {new Date(pedido.data_inicio).toLocaleDateString('pt-BR')} -{' '}
                        {new Date(pedido.data_fim).toLocaleDateString('pt-BR')}
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">
                    {pedido.created_at && formatDistanceToNow(new Date(pedido.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-gray-400 text-center pt-4">
        💡 Dados financeiros serão exibidos na FASE 3
      </p>
    </div>
  );
};

export default PedidosTab;
