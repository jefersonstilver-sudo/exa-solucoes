import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, DollarSign, MapPin, RefreshCw, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { Link, useLocation } from 'react-router-dom';

interface PaidOrder {
  id: string;
  created_at: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  client_id: string;
  client_email: string;
  client_name: string;
}

interface RealPaidOrdersSectionProps {
  loading: boolean;
  onRefresh: () => void;
}

const RealPaidOrdersSection: React.FC<RealPaidOrdersSectionProps> = ({ loading, onRefresh }) => {
  const [paidOrders, setPaidOrders] = useState<PaidOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { isMobile } = useAdvancedResponsive();
  const base = useLocation().pathname.startsWith('/admin') ? '/admin' : '/super_admin';

  const fetchPaidOrders = async () => {
    try {
      setLoadingOrders(true);
      console.log('🔍 Buscando pedidos pagos sem vídeo...');
      
      const { data, error } = await supabase.rpc('get_paid_orders_without_video');

      if (error) {
        console.error('❌ Erro ao buscar pedidos pagos:', error);
        throw error;
      }

      console.log('✅ Pedidos pagos encontrados:', data?.length || 0);
      setPaidOrders(data || []);
    } catch (error) {
      console.error('💥 Erro ao carregar pedidos pagos:', error);
      toast.error('Erro ao carregar pedidos pagos');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchPaidOrders();
  }, []);

  // Abre o e-mail do aparelho com o lembrete pronto (antes mostrava "enviado" sem enviar nada)
  const sendReminderEmail = async (clientEmail: string, orderId: string) => {
    if (!clientEmail || !clientEmail.includes('@')) { toast.error('Cliente sem e-mail cadastrado'); return; }
    const assunto = encodeURIComponent('Seu anúncio na EXA está esperando o vídeo');
    const corpo = encodeURIComponent(`Olá! Seu pedido na EXA Mídia (#${orderId.slice(0, 8)}) está pago e só falta o vídeo para entrar nas telas.\n\nEnvie pelo portal: https://examidia.com.br/anunciante/pedido/${orderId}\nOu peça para a Sofia criar o vídeo pelo WhatsApp.\n\nEquipe EXA Mídia`);
    window.location.href = `mailto:${clientEmail}?subject=${assunto}&body=${corpo}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loadingOrders || loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-3 text-foreground text-sm">Carregando pedidos...</span>
        </div>
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    if (paidOrders.length === 0) {
      return (
        <div className="rounded-[22px] border border-black/[0.06] bg-white/75 px-6 py-10 text-center backdrop-blur-xl">
          <Clock className="mx-auto mb-3 h-10 w-10 text-[#B5B6BA]" />
          <div className="text-[15px] font-bold">Nenhum pedido esperando vídeo</div>
        </div>
      );
    }
    return (
      <div className="divide-y divide-black/[0.05] overflow-hidden rounded-[22px] border border-black/[0.06] bg-white/80 backdrop-blur-xl">
        {paidOrders.map((order) => (
          <div key={order.id} className="flex items-center gap-2 pr-2">
            <Link to={`${base}/pedidos/${order.id}`} className="min-w-0 flex-1 px-4 py-3 active:bg-black/[0.03]">
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[15.5px] font-extrabold">{order.client_name && !/n[ãa]o dispon/i.test(order.client_name) ? order.client_name : (order.client_email || 'Cliente')}</span>
                <span className="shrink-0 text-[12px] font-semibold text-[#8A8B90]">{formatDate(order.created_at)}</span>
              </span>
              <span className="mt-0.5 block truncate text-[13px] text-[#5E5F63]">{order.client_email}</span>
              <span className="mt-0.5 block text-[12.5px] font-semibold text-[#6A6B70]">
                {formatCurrency(order.valor_total || 0)} · {order.lista_paineis?.length || 0} {(order.lista_paineis?.length || 0) === 1 ? 'tela' : 'telas'} · {order.plano_meses || 1} {(order.plano_meses || 1) === 1 ? 'mês' : 'meses'}
              </span>
            </Link>
            <button type="button" aria-label="Mandar lembrete por e-mail" onClick={() => sendReminderEmail(order.client_email, order.id)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FCF1DF] text-[#9A5300] active:scale-95">
              <Mail className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-6">
      <Card className="bg-card border">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center text-foreground">
            <Clock className="h-5 w-5 mr-2 text-amber-500" />
            Pedidos Pagos Aguardando Vídeo
          </CardTitle>
          <CardDescription>
            Clientes que já pagaram mas ainda não enviaram o vídeo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {paidOrders.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum pedido aguardando vídeo
              </h3>
              <p className="text-muted-foreground">
                Todos os clientes que pagaram já enviaram seus vídeos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paidOrders.map((order) => (
                <Card key={order.id} className="bg-card border hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-amber-100 text-amber-800 font-semibold text-xs px-2 py-1">
                        Aguardando Vídeo
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{order.client_name}</span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {order.client_email}
                      </div>
                      
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm font-bold text-emerald-600">
                          {formatCurrency(order.valor_total)}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {order.lista_paineis?.length || 0} painéis • {order.plano_meses} meses
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendReminderEmail(order.client_email, order.id)}
                        className="w-full border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E] hover:text-white"
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Enviar Lembrete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealPaidOrdersSection;
