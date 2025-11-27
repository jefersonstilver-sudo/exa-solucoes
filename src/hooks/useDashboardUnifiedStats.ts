import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationTypeStats {
  conversas: number;
  enviadas: number;
  recebidas: number;
}

export interface UnifiedDashboardStats {
  cadastros: number;
  cadastrosAnterior: number;
  pedidos: number;
  pedidosDetalhes: {
    pagos: number;
    pendentes: number;
    ticketMedio: number;
  };
  vendas: number;
  vendasAnterior: number;
  conversas: number;
  conversasPorTipo: Record<string, ConversationTypeStats>;
  mensagensEnviadas: number;
  mensagensRecebidas: number;
  prediosAtivos: number;
  prediosTotal: number;
  prediosPercentual: number;
  vouchersPendentes: number;
  vouchersList: Array<{
    provider_name: string;
    benefit_choice: string;
    benefit_chosen_at: string;
  }>;
  loading: boolean;
}

export const useDashboardUnifiedStats = (startDate: Date, endDate: Date) => {
  const [stats, setStats] = useState<UnifiedDashboardStats>({
    cadastros: 0,
    cadastrosAnterior: 0,
    pedidos: 0,
    pedidosDetalhes: { pagos: 0, pendentes: 0, ticketMedio: 0 },
    vendas: 0,
    vendasAnterior: 0,
    conversas: 0,
    conversasPorTipo: {},
    mensagensEnviadas: 0,
    mensagensRecebidas: 0,
    prediosAtivos: 0,
    prediosTotal: 0,
    prediosPercentual: 0,
    vouchersPendentes: 0,
    vouchersList: [],
    loading: true
  });

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      const start = startDate.toISOString();
      const end = endDate.toISOString();

      // Período anterior para comparação
      const diffMs = endDate.getTime() - startDate.getTime();
      const previousStart = new Date(startDate.getTime() - diffMs);
      const previousEnd = startDate;

      // 1. Cadastros
      const { count: cadastros } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start)
        .lte('created_at', end);

      const { count: cadastrosAnterior } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString());

      // 2. Pedidos (não cortesia)
      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('status, valor_total')
        .gte('created_at', start)
        .lte('created_at', end)
        .gt('valor_total', 0);

      const pedidos = pedidosData?.length || 0;
      const pagos = pedidosData?.filter(p => p.status === 'pago').length || 0;
      const pendentes = pedidosData?.filter(p => p.status !== 'pago').length || 0;
      const ticketMedio = pedidosData?.length 
        ? pedidosData.reduce((sum, p) => sum + (p.valor_total || 0), 0) / pedidosData.length 
        : 0;

      // 3. Vendas
      const { data: vendasData } = await supabase
        .from('pedidos')
        .select('valor_total')
        .eq('status', 'pago')
        .gte('created_at', start)
        .lte('created_at', end)
        .gt('valor_total', 0);

      const vendas = vendasData?.reduce((sum, p) => sum + (p.valor_total || 0), 0) || 0;

      const { data: vendasAnteriores } = await supabase
        .from('pedidos')
        .select('valor_total')
        .eq('status', 'pago')
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString())
        .gt('valor_total', 0);

      const vendasAnterior = vendasAnteriores?.reduce((sum, p) => sum + (p.valor_total || 0), 0) || 0;

      // 4. Conversas com Mensagens do Período
      const { data: mensagensData } = await supabase
        .from('messages')
        .select(`
          conversation_id,
          direction,
          conversations!inner(contact_type)
        `)
        .gte('created_at', start)
        .lte('created_at', end);

      // Contar conversas únicas
      const conversasUnicas = new Set(mensagensData?.map(m => m.conversation_id) || []);
      const conversas = conversasUnicas.size;

      // Agrupar por tipo de contato
      const conversasPorTipo: Record<string, ConversationTypeStats> = {};
      const conversasPorId: Record<string, string> = {};

      mensagensData?.forEach(msg => {
        const contactType = (msg.conversations as any)?.contact_type || 'Sem tipo';
        
        // Registrar tipo de conversa
        if (!conversasPorId[msg.conversation_id]) {
          conversasPorId[msg.conversation_id] = contactType;
        }

        // Inicializar stats se não existir
        if (!conversasPorTipo[contactType]) {
          conversasPorTipo[contactType] = {
            conversas: 0,
            enviadas: 0,
            recebidas: 0
          };
        }

        // Contar mensagens
        if (msg.direction === 'outgoing') {
          conversasPorTipo[contactType].enviadas++;
        } else if (msg.direction === 'incoming') {
          conversasPorTipo[contactType].recebidas++;
        }
      });

      // Contar conversas únicas por tipo
      Object.values(conversasPorId).forEach(tipo => {
        if (conversasPorTipo[tipo]) {
          conversasPorTipo[tipo].conversas++;
        }
      });

      // Totais gerais
      const mensagensEnviadas = Object.values(conversasPorTipo).reduce((sum, stats) => sum + stats.enviadas, 0);
      const mensagensRecebidas = Object.values(conversasPorTipo).reduce((sum, stats) => sum + stats.recebidas, 0);

      // 5. Prédios Ativos
      const { data: predios } = await supabase
        .from('buildings')
        .select('status');

      const prediosTotal = predios?.length || 0;
      const prediosAtivos = predios?.filter(p => p.status === 'ativo').length || 0;
      const prediosPercentual = prediosTotal > 0 ? (prediosAtivos / prediosTotal) * 100 : 0;

      // 6. Vouchers Pendentes
      const { data: vouchers } = await supabase
        .from('provider_benefits')
        .select('provider_name, benefit_choice, benefit_chosen_at')
        .eq('status', 'choice_made')
        .is('gift_code', null)
        .order('benefit_chosen_at', { ascending: false });

      setStats({
        cadastros: cadastros || 0,
        cadastrosAnterior: cadastrosAnterior || 0,
        pedidos,
        pedidosDetalhes: { pagos, pendentes, ticketMedio },
        vendas,
        vendasAnterior,
        conversas,
        conversasPorTipo,
        mensagensEnviadas,
        mensagensRecebidas,
        prediosAtivos,
        prediosTotal,
        prediosPercentual,
        vouchersPendentes: vouchers?.length || 0,
        vouchersList: vouchers || [],
        loading: false
      });
    } catch (error) {
      console.error('[useDashboardUnifiedStats] Error:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  return { stats, refetch: fetchStats };
};
