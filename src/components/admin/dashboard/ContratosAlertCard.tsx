import React, { useState, useEffect } from 'react';
import { FileSignature, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
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

const ContratosAlertCard: React.FC = () => {
  const navigate = useNavigate();
  const { value: expiringDays, updateValue } = useCardConfig('dashboard_contracts_expiring_days', 7);
  const [stats, setStats] = useState<ContratoStats>({
    pendentes: 0,
    enviados: 0,
    expirando: 0,
    vencidos: 0
  });
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
    <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-out">
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

        {/* Alertas */}
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
