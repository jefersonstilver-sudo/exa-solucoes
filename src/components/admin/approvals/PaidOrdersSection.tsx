
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
  data_inicio: string;
  data_fim: string;
  client_id: string;
  client_email?: string;
}

interface PaidOrdersSectionProps {
  loading: boolean;
  onRefresh: () => void;
}

const PaidOrdersSection: React.FC<PaidOrdersSectionProps> = ({ loading, onRefresh }) => {
  const [paidOrders, setPaidOrders] = useState<PaidOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const fetchPaidOrders = async () => {
    try {
      setLoadingOrders(true);
      console.log('🔍 Buscando pedidos pagos sem vídeo...');
      
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('status', 'pago_pendente_video')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar pedidos pagos:', error);
        throw error;
      }

      console.log('✅ Pedidos pagos encontrados:', data?.length || 0);
      
      // Enriquecer com dados do cliente
      const enrichedOrders = await Promise.all(
        (data || []).map(async (order) => {
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('email')
              .eq('id', order.client_id)
              .single();

            return {
              ...order,
              client_email: userData?.email || 'Email não encontrado'
            };
          } catch (error) {
            console.warn(`Erro ao buscar dados do cliente ${order.client_id}:`, error);
            return {
              ...order,
              client_email: 'Email não encontrado'
            };
          }
        })
      );

      setPaidOrders(enrichedOrders);
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
      
      // Aqui você implementaria o envio de email
      // Por enquanto, apenas simular
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
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
            <span className="ml-3 text-gray-600">Carregando pedidos pagos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-orange-500" />
            Pedidos Pagos Aguardando Vídeo
          </CardTitle>
          <CardDescription>
            Clientes que já pagaram mas ainda não enviaram o vídeo de 15 segundos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paidOrders.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum pedido aguardando vídeo
              </h3>
              <p className="text-gray-500">
                Todos os clientes que pagaram já enviaram seus vídeos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paidOrders.map((order) => (
                <Card key={order.id} className="border-orange-200 bg-orange-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-orange-100 text-orange-800">
                        Aguardando Vídeo
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm font-medium">{order.client_email}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(order.valor_total)}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">
                          {order.lista_paineis?.length || 0} painéis • {order.plano_meses} meses
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Período: {formatDate(order.data_inicio)} - {formatDate(order.data_fim)}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-orange-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendReminderEmail(order.client_email!, order.id)}
                        className="w-full"
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

export default PaidOrdersSection;
