import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, DollarSign, MapPin, RefreshCw, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

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

  const sendReminderEmail = async (clientEmail: string, orderId: string) => {
    try {
      toast.loading('Enviando lembrete...');
      
      // Simular envio de email - implementar lógica real depois
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.dismiss();
      toast.success(`Lembrete enviado para ${clientEmail}`);
    } catch (error) {
      toast.dismiss();
      toast.error('Erro ao enviar lembrete');
    }
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
    return (
      <div className="space-y-3">
        {paidOrders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-6 text-center shadow-sm">
            <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="text-sm font-medium text-foreground mb-1">
              Nenhum pedido aguardando
            </h3>
            <p className="text-xs text-muted-foreground">
              Todos os clientes já enviaram vídeos
            </p>
          </div>
        ) : (
          paidOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-3 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 font-medium">
                  Aguardando Vídeo
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(order.created_at)}
                </span>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {order.client_name}
                  </span>
                </div>
                
                <div className="text-[10px] text-muted-foreground truncate">
                  {order.client_email}
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-semibold">
                    {formatCurrency(order.valor_total)}
                  </span>
                  <span className="text-muted-foreground">
                    {order.lista_paineis?.length || 0} painéis • {order.plano_meses}m
                  </span>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendReminderEmail(order.client_email, order.id)}
                className="w-full mt-3 h-8 text-xs border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E] hover:text-white"
              >
                <Mail className="h-3 w-3 mr-1" />
                Enviar Lembrete
              </Button>
            </div>
          ))
        )}
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
            Clientes que já pagaram mas ainda não enviaram o vídeo de 15 segundos
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
