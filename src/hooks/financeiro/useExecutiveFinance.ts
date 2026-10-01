import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type StatementMovement = { id: string; data: string; tipo: string; descricao: string | null; valor: number; saldo: number; correspondencia_status: string; payment_id: string | null; transfer_id: string | null; bill_payment_id: string | null; raw_data?: unknown };
export type FinanceSnapshot = {
  entradas: number; saidas: number; receita: number; previsto: number; inadimplencia: number;
  mrr: number | null; contasPagar: number; fixas: number; variaveis: number;
  pendencias: number; total: number; lastSync: string | null; certified: boolean; warning: string;
};
const BATCH = 500;

// Classification is display-only. Never settle an obligation or infer an identity from an amount.
export function movementCategory(row: Pick<StatementMovement, 'tipo' | 'descricao'>): string {
  if (/\b(openai|chatgpt)\b/i.test(row.descricao || '')) return 'Software / IA';
  if (row.tipo === 'PAYMENT_RECEIVED') return 'Recebimento';
  if (row.tipo === 'TRANSFER' || row.tipo === 'BILL_PAYMENT') return 'Pagamento / transferência';
  if (/FEE|TAX/i.test(row.tipo)) return 'Taxas';
  return 'Outros';
}

export function useExecutiveFinance() {
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const today = new Date();
      const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const first = `${month}-01`;
      const [runResult, countResult, lastResult, balanceResult, subscriptionsResult, chargesResult, fixedResult, variableResult, installmentsResult] = await Promise.all([
        supabase.from('sync_runs').select('state,finished_at,items_count').eq('source', 'asaas_statement').order('started_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('asaas_extrato_movimentos').select('id', { count: 'exact', head: true }),
        supabase.from('asaas_extrato_movimentos').select('saldo').order('ordem_asaas', { ascending: true, nullsFirst: false }).limit(1).maybeSingle(),
        supabase.functions.invoke('get-asaas-balance'),
        supabase.from('assinaturas').select('pedido_id,valor_mensal').eq('status', 'ativa'),
        supabase.from('cobrancas').select('valor,status,data_vencimento').in('status', ['pendente', 'vencido']).limit(1001),
        supabase.from('despesas_fixas').select('valor,status').eq('ativo', true).limit(1001),
        supabase.from('despesas_variaveis').select('valor,status').gte('data', first).lt('data', `${month}-32`).limit(1001),
        supabase.from('parcelas_despesas').select('valor,status').eq('competencia', month).limit(1001),
      ]);
      const responses = [runResult, countResult, lastResult, subscriptionsResult, chargesResult, fixedResult, variableResult, installmentsResult];
      if (responses.some(result => result.error)) throw new Error('Leitura financeira indisponível');
      if ([chargesResult.data, fixedResult.data, variableResult.data, installmentsResult.data].some(items => (items?.length || 0) > 1000)) throw new Error('Leitura parcial de obrigações');
      const run = runResult.data;
      const total = countResult.count;
      const balance = !balanceResult.error && balanceResult.data?.balance?.source === 'asaas' ? Number(balanceResult.data.balance.available) : NaN;
      const lastBalance = lastResult.data?.saldo == null ? NaN : Number(lastResult.data.saldo);
      const current = !!run?.finished_at && Date.now() - new Date(run.finished_at).getTime() < 60 * 60 * 1000;
      const certified = run?.state === 'completed' && current && total != null && total === run.items_count && Number.isFinite(balance) && Number.isFinite(lastBalance) && Math.abs(balance - lastBalance) < 0.005;
      const warning = !run || total == null ? 'Sem leitura completa do extrato.' : run.state !== 'completed' ? 'Última sincronização não concluída.' : !current ? 'Sincronização desatualizada.' : total !== run.items_count ? 'Quantidade de movimentos divergente.' : !Number.isFinite(balance) ? 'Saldo ao vivo indisponível.' : Math.abs(balance - lastBalance) >= 0.005 ? 'Saldo Asaas e extrato divergentes.' : 'Espelho conferido com saldo e quantidade; correspondências individuais ainda pendentes.';
      let entries = 0, exits = 0, received = 0, pending = 0;
      // The statement mirror is the only source for actual cash. Read every page; a partial page is never a zero.
      for (let offset = 0; offset < (total || 0); offset += BATCH) {
        const { data, error: pageError } = await supabase.from('asaas_extrato_movimentos').select('valor,tipo,correspondencia_status').gte('data', first).lte('data', `${month}-31`).order('ordem_asaas', { ascending: true }).range(offset, offset + BATCH - 1);
        if (pageError) throw pageError;
        // Month-filtered rows may be fewer than all-time count; continue by returned page length below.
        for (const row of data || []) {
          const value = Number(row.valor);
          if (value > 0) entries += value;
          if (value < 0) exits += Math.abs(value);
          if (row.tipo === 'PAYMENT_RECEIVED' && value > 0) received += value;
        }
        if (!data || data.length < BATCH) break;
      }
      // Count all unresolved correspondences independently from month and without the 1000-row limit.
      const unresolved = await supabase.from('asaas_extrato_movimentos').select('id', { count: 'exact', head: true }).neq('correspondencia_status', 'correspondente');
      if (unresolved.error || unresolved.count == null) throw new Error('Pendências indisponíveis');
      pending = unresolved.count;
      const subs = subscriptionsResult.data || [];
      let mrr: number | null = null;
      if (subs.length <= 1000 && subs.every(sub => sub.pedido_id)) {
        const ids = [...new Set(subs.map(sub => sub.pedido_id).filter((id): id is string => !!id))];
        const orders = ids.length ? await supabase.from('pedidos').select('id,is_test_order,is_master').in('id', ids) : null;
        if (!orders?.error && (orders?.data?.length || 0) === ids.length) {
          const eligible = new Set((orders?.data || []).filter(order => !order.is_test_order && !order.is_master).map(order => order.id));
          mrr = subs.filter(sub => sub.pedido_id && eligible.has(sub.pedido_id)).reduce((sum, sub) => sum + Number(sub.valor_mensal || 0), 0);
        }
      }
      const charges = chargesResult.data || [];
      const fixed = fixedResult.data || [];
      const variable = variableResult.data || [];
      const installments = installmentsResult.data || [];
      const sum = (items: { valor: number }[]) => items.reduce((value, item) => value + Number(item.valor || 0), 0);
      setSnapshot({ entradas: entries, saidas: exits, receita: received, previsto: sum(charges.filter(c => c.status === 'pendente' && c.data_vencimento?.startsWith(month))), inadimplencia: sum(charges.filter(c => c.status === 'vencido' || (c.status === 'pendente' && c.data_vencimento < today.toISOString().slice(0, 10)))), mrr, contasPagar: sum(installments.filter(item => item.status !== 'pago' && item.status !== 'cancelado')) + sum(variable.filter(item => item.status === 'pendente')), fixas: sum(fixed), variaveis: sum(variable), pendencias: pending, total: total || 0, lastSync: run?.finished_at || null, certified: !!certified && pending === 0, warning: pending > 0 ? `${pending} movimentos sem correspondência única por ID; espelho não certificado como conciliado.` : warning });
    } catch (cause) {
      console.error('Resumo financeiro indisponível', cause);
      setSnapshot(null); setError(true);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 60_000); return () => window.clearInterval(timer); }, [refresh]);
  return { snapshot, loading, error, refresh };
}
