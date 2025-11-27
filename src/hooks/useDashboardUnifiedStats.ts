import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  conversasPorAgente: Record<string, number>;
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
    conversasPorAgente: {},
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

      // 4. Conversas
      const { data: conversasData } = await supabase
        .from('conversations')
        .select('agent_key')
        .gte('created_at', start)
        .lte('created_at', end);

      const conversas = conversasData?.length || 0;
      const conversasPorAgente: Record<string, number> = {};
      conversasData?.forEach(conv => {
        const agent = conv.agent_key || 'unknown';
        conversasPorAgente[agent] = (conversasPorAgente[agent] || 0) + 1;
      });

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
        conversasPorAgente,
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
