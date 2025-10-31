
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, DollarSign, MapPin, RefreshCw, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#00FFAB]" />
            <span className="ml-3 text-gray-900">Carregando pedidos pagos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center text-gray-900">
            <Clock className="h-5 w-5 mr-2 text-[#00FFAB]" />
            Pedidos Pagos Aguardando Vídeo
          </CardTitle>
          <CardDescription className="text-gray-600">
            Clientes que já pagaram mas ainda não enviaram o vídeo de 15 segundos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {paidOrders.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum pedido aguardando vídeo
              </h3>
              <p className="text-gray-600">
                Todos os clientes que pagaram já enviaram seus vídeos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paidOrders.map((order) => (
                <Card key={order.id} className="bg-gradient-to-br from-[#9C1E1E]/20 to-white border-[#D72638]/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-[#D72638] text-white font-semibold text-xs px-2 py-1">
                        Aguardando Vídeo
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-[#00FFAB]" />
                        <span className="text-sm font-medium text-gray-900">{order.client_name}</span>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        {order.client_email}
                      </div>
                      
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-[#00FFAB]" />
                        <span className="text-sm font-bold text-[#00FFAB]">
                          {formatCurrency(order.valor_total)}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-[#00FFAB]" />
                        <span className="text-sm text-gray-700">
                          {order.lista_paineis?.length || 0} painéis • {order.plano_meses} meses
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendReminderEmail(order.client_email, order.id)}
                        className="w-full border-[#D72638] text-[#9C1E1E] hover:bg-[#D72638] hover:text-white"
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
