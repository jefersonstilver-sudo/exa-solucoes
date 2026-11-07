// EXA (07/11/2026) — o que já ENTROU no mês: só linhas PAYMENT_RECEIVED do espelho do extrato do Asaas, pela data do movimento.
// Nunca inferido de status de pedido, valor_total ou parcelas antigas (regra do financeiro).
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRecebidoNoMes = () =>
  useQuery({
    queryKey: ['recebido-no-mes'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const ini = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;
      const fim = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
      let total = 0, n = 0;
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from('asaas_extrato_movimentos').select('valor').eq('tipo', 'PAYMENT_RECEIVED').gte('data', ini).lte('data', fim).order('ordem_asaas', { ascending: true }).range(offset, offset + 499);
        if (error || !data) return { total: null as number | null, n: 0 };
        total += data.reduce((a, r: any) => a + Number(r.valor || 0), 0); n += data.length;
        if (data.length < 500) return { total, n };
      }
    },
  });
