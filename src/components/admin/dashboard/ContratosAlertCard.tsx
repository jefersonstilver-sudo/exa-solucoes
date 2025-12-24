import React, { useState, useEffect } from 'react';
import { FileSignature, Clock, AlertTriangle, ArrowRight, FileX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCardConfig } from '@/hooks/useCardConfig';
import CardConfigPopover from './CardConfigPopover';

interface ContratoStats {
  pendentes: number;
  enviados: number;
  expirando: number;
  vencidos: number;
}

interface PedidoSemContrato {
  id: string;
  clientName: string;
  status: string;
}

const ContratosAlertCard: React.FC = () => {
  const navigate = useNavigate();
  const { value: expiringDays, updateValue } = useCardConfig('dashboard_contracts_expiring_days', 7);
  const [stats, setStats] = useState<ContratoStats>({
    pendentes: 0,
    enviados: 0,
    expirando: 0,
    vencidos: 0
  });
  const [pedidosSemContrato, setPedidosSemContrato] = useState<PedidoSemContrato[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContractStats = async () => {
      try {
        const now = new Date();
        const expiringDate = new Date(now.getTime() + expiringDays * 24 * 60 * 60 * 1000);

        // Buscar pedidos que exigem contrato
        const { data, error } = await supabase
          .from('pedidos')
          .select('id, contrato_status, contrato_enviado_em')
          .eq('exigir_contrato', true)
          .in('contrato_status', ['pendente', 'enviado']);

        if (error) {
          console.error('[ContratosAlertCard] Error:', error);
          return;
        }

        let pendentes = 0;
        let enviados = 0;
        let expirando = 0;
        let vencidos = 0;

        // Prazo padrão de assinatura: 7 dias após envio
        const prazoAssinaturaDias = 7;

        data?.forEach(pedido => {
          if (pedido.contrato_status === 'pendente') {
            pendentes++;
          } else if (pedido.contrato_status === 'enviado') {
            enviados++;
            
            // Calcular expiração baseado na data de envio + prazo
            if (pedido.contrato_enviado_em) {
              const enviadoEm = new Date(pedido.contrato_enviado_em);
              const expiresAt = new Date(enviadoEm.getTime() + prazoAssinaturaDias * 24 * 60 * 60 * 1000);
              
              if (expiresAt < now) {
                vencidos++;
              } else if (expiresAt < expiringDate) {
                expirando++;
              }
            }
          }
        });

        setStats({ pendentes, enviados, expirando, vencidos });

        // Buscar pedidos ATIVOS que não têm contrato assinado
        const { data: pedidosAtivos, error: pedidosError } = await supabase
          .from('pedidos')
          .select('id, client_id, status, contrato_status')
          .in('status', ['ativo', 'pago_pendente_video'])
          .or('contrato_status.is.null,contrato_status.neq.assinado');

        if (pedidosError) {
          console.error('[ContratosAlertCard] Error fetching active orders:', pedidosError);
        } else if (pedidosAtivos && pedidosAtivos.length > 0) {
          // Buscar nomes dos clientes
          const clientIds = [...new Set(pedidosAtivos.map(p => p.client_id).filter(Boolean))];
          
          let clientNames: Record<string, string> = {};
          if (clientIds.length > 0) {
            const { data: clients } = await supabase
              .from('users')
              .select('id, nome, email')
              .in('id', clientIds);
            
            clients?.forEach(c => {
              clientNames[c.id] = c.nome || c.email?.split('@')[0] || 'Cliente';
            });
          }

          const pedidosSemContratoList: PedidoSemContrato[] = pedidosAtivos.map(p => ({
            id: p.id,
            clientName: clientNames[p.client_id] || 'Cliente',
            status: p.status
          }));

          setPedidosSemContrato(pedidosSemContratoList);
        }
      } catch (err) {
        console.error('[ContratosAlertCard] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContractStats();

    // Subscribe to changes
    const channel = supabase
      .channel('contracts_dashboard_monitor')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pedidos'
      }, () => {
        fetchContractStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [expiringDays]);

  const totalPendentes = stats.pendentes + stats.enviados;

  if (loading) {
    return (
      <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-5 bg-gray-200 rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 ease-out">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm md:text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-blue-500" />
            Contratos Pendentes
          </div>
          <CardConfigPopover
            label="Dias para alerta de expiração"
            unit="dias"
            value={expiringDays}
            onSave={updateValue}
            min={1}
            max={30}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Número principal */}
        <div className="text-center py-2">
          <span className="text-4xl font-bold text-blue-600">{totalPendentes}</span>
          <p className="text-xs text-muted-foreground mt-1">aguardando assinatura</p>
        </div>

        {/* Detalhes */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-center">
            <span className="text-lg font-bold text-gray-700">{stats.pendentes}</span>
            <p className="text-[10px] text-muted-foreground">A enviar</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-center">
            <span className="text-lg font-bold text-blue-700">{stats.enviados}</span>
            <p className="text-[10px] text-muted-foreground">Enviados</p>
          </div>
        </div>

        {/* Alertas de expiração */}
        {(stats.expirando > 0 || stats.vencidos > 0) && (
          <div className="flex flex-wrap gap-2">
            {stats.expirando > 0 && (
              <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-300">
                <Clock className="h-3 w-3 mr-1" />
                {stats.expirando} expirando
              </Badge>
            )}
            {stats.vencidos > 0 && (
              <Badge className="text-[10px] bg-red-100 text-red-700 border-red-300">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {stats.vencidos} vencidos
              </Badge>
            )}
          </div>
        )}

        {/* NOVO: Alerta de pedidos ativos sem contrato */}
        {pedidosSemContrato.length > 0 && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <FileX className="h-4 w-4 text-red-600" />
              <span className="text-xs font-semibold text-red-700">
                {pedidosSemContrato.length} pedido{pedidosSemContrato.length > 1 ? 's' : ''} ativo{pedidosSemContrato.length > 1 ? 's' : ''} sem contrato
              </span>
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {pedidosSemContrato.slice(0, 3).map(pedido => (
                <div key={pedido.id} className="text-[10px] text-red-600 truncate">
                  • {pedido.clientName}
                </div>
              ))}
              {pedidosSemContrato.length > 3 && (
                <div className="text-[10px] text-red-500 font-medium">
                  +{pedidosSemContrato.length - 3} mais...
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate('/admin/juridico')}
        >
          Ver contratos
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContratosAlertCard;
