import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';
import ExtratoAsaasDetailSheet from './ExtratoAsaasDetailSheet';

type Movement = { id: string; data: string; tipo: string; descricao: string | null; valor: number; saldo: number; payment_id: string | null; transfer_id: string | null; bill_payment_id: string | null; correspondencia_status: string; synced_at: string };
type Run = { state: string; finished_at: string | null; started_at: string; items_count: number; errors: unknown };
const PAGE_SIZE = 50;
const dateLabel = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;

export default function ExtratoAsaasPage() {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [rows, setRows] = useState<Movement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState('todos');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [initialCheck, setInitialCheck] = useState(true);
  const [autoAttempted, setAutoAttempted] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [run, setRun] = useState<Run | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [closing, setClosing] = useState<number | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      let request = supabase.from('asaas_extrato_movimentos').select('id,data,tipo,descricao,valor,saldo,payment_id,transfer_id,bill_payment_id,correspondencia_status,synced_at', { count: 'exact' }).order('ordem_asaas', { ascending: true, nullsFirst: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (from) request = request.gte('data', from);
      if (to) request = request.lte('data', to);
      if (direction === 'entrada') request = request.gt('valor', 0);
      if (direction === 'saida') request = request.lt('valor', 0);
      if (query.trim()) request = request.or(`descricao.ilike.%${query.trim().replace(/[%_,.()]/g, '')}%,id.ilike.%${query.trim().replace(/[%_,.()]/g, '')}%`);
      const [result, lastRun, final] = await Promise.all([
        request,
        supabase.from('sync_runs').select('state,finished_at,started_at,items_count,errors').eq('source', 'asaas_statement').order('started_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('asaas_extrato_movimentos').select('saldo').order('ordem_asaas', { ascending: true, nullsFirst: false }).limit(1).maybeSingle(),
      ]);
      if (result.error) throw result.error;
      setRows((result.data || []) as Movement[]);
      setTotal(result.count || 0);
      setRun(lastRun.data as Run | null);
      setClosing(final.data?.saldo == null ? null : Number(final.data.saldo));
      setInitialCheck(false);
    } catch (e) {
      setCheckFailed(true);
      console.error('Extrato indisponível', e);
      toast.error('Não foi possível carregar o extrato');
    } finally { setInitialCheck(false); setLoading(false); }
  }, [page, from, to, direction, query]);
  const fetchBalance = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('get-asaas-balance');
    setBalance(!error && data?.balance?.source === 'asaas' && typeof data.balance.available === 'number' ? data.balance.available : null);
  }, []);
  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      // Updating the existing mirrors first makes ID-based correspondence meaningful.
      const [payments, outflows] = await Promise.all([
        supabase.functions.invoke('sync-asaas-transactions', { body: {} }),
        supabase.functions.invoke('sync-asaas-outflows', { body: {} }),
      ]);
      if (payments.error || payments.data?.success === false || outflows.error || outflows.data?.success === false) throw new Error('Espelhos de cobrança/saída indisponíveis');
      const statement = await supabase.functions.invoke('sync-asaas-statement', { body: {} });
      if (statement.error || !statement.data?.success) throw new Error(statement.data?.reason || 'Extrato indisponível');
      setSyncError(false);
      toast.success(`${statement.data.items} movimentos conferidos com o Asaas`);
      await Promise.all([load(), fetchBalance()]);
    } catch (e) {
      setSyncError(true);
      toast.error(e instanceof Error ? e.message : 'Falha ao sincronizar o extrato');
      await load();
    } finally { setSyncing(false); }
  }, [load, fetchBalance]);
  useEffect(() => { load(); fetchBalance(); }, [load, fetchBalance]);
  // A visit refreshes a stale mirror; no public endpoint or finance-writing cron is enabled.
  useEffect(() => {
    if (initialCheck || checkFailed || autoAttempted || run?.state === 'running' || syncing) return;
    if (!run?.finished_at || Date.now() - new Date(run.finished_at).getTime() > 60 * 60 * 1000) {
      setAutoAttempted(true);
      void sync();
    }
  }, [initialCheck, checkFailed, autoAttempted, run?.state, run?.finished_at, syncing, sync]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (!syncing && !syncError) void sync(); }, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [sync, syncing, syncError]);
  return (
    <main className="min-h-screen bg-background p-4 md:p-6 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" aria-label="Voltar a lançamentos" onClick={() => navigate(buildPath('financeiro/lancamentos'))}><ArrowLeft className="h-4 w-4" /></Button>
            <div><h1 className="text-xl font-semibold">Extrato Asaas</h1><p className="text-sm text-muted-foreground">Movimentações da conta</p></div>
          </div>
          <Button variant="outline" onClick={() => void sync()} disabled={syncing}><RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />{syncing ? 'Atualizando...' : 'Atualizar extrato'}</Button>
        </header>
        <section className="grid gap-4 border-b pb-6 sm:grid-cols-3" aria-label="Saldos e atualização">
          <div><p className="text-xs text-muted-foreground">Disponível no Asaas</p><p className="mt-1 text-2xl font-semibold tabular-nums">{balance == null ? 'Indisponível' : formatCurrency(balance)}</p></div>
          <div><p className="text-xs text-muted-foreground">Último saldo no extrato</p><p className="mt-1 text-2xl font-semibold tabular-nums">{closing == null ? '—' : formatCurrency(closing)}</p></div>
          <div><p className="text-xs text-muted-foreground">Última sincronização</p><p className="mt-1 text-sm font-medium">{run?.state === 'completed' && run.finished_at ? new Date(run.finished_at).toLocaleString('pt-BR') : run?.state === 'running' ? 'Em andamento' : 'Não concluída'}</p><p className="text-xs text-muted-foreground">{run?.state === 'failed' || syncError ? 'Falhou; consulte o histórico antes de considerar os dados atuais.' : run?.state === 'completed' ? `${run.items_count} movimentos na última leitura` : 'O espelho pode estar desatualizado.'}</p></div>
        </section>
        <section className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="relative min-w-48 flex-1"><span className="sr-only">Buscar movimento</span><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar descrição ou ID" value={query} onChange={e => { setPage(0); setQuery(e.target.value); }} /></label>
            <Select value={direction} onValueChange={v => { setPage(0); setDirection(v); }}><SelectTrigger className="w-36" aria-label="Direção"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="entrada">Entradas</SelectItem><SelectItem value="saida">Saídas</SelectItem></SelectContent></Select>
            <label className="text-xs text-muted-foreground">De<Input type="date" value={from} onChange={e => { setPage(0); setFrom(e.target.value); }} /></label>
            <label className="text-xs text-muted-foreground">Até<Input type="date" value={to} onChange={e => { setPage(0); setTo(e.target.value); }} /></label>
          </div>
          <p className="text-xs text-muted-foreground">{total} movimentos encontrados · Correspondência por ID oficial, sem baixa automática</p>
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full min-w-[780px] text-sm"><thead className="bg-muted/50 text-muted-foreground"><tr><th className="p-3 text-left">Data</th><th className="p-3 text-left">Movimento</th><th className="p-3 text-left">Conferência</th><th className="p-3 text-right">Valor</th><th className="p-3 text-right">Saldo</th></tr></thead>
              <tbody>{rows.map(row => <tr key={row.id} className="border-t cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-primary" tabIndex={0} role="button" aria-label={`Detalhes do movimento ${row.descricao || row.tipo}, ${dateLabel(row.data)}`} onClick={() => setSelectedMovement(row)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedMovement(row); } }}><td className="p-3 whitespace-nowrap">{dateLabel(row.data)}</td><td className="p-3"><div className="flex items-center gap-2 font-medium">{row.valor >= 0 ? <ArrowDownLeft className="h-4 w-4 text-primary" /> : <ArrowUpRight className="h-4 w-4 text-destructive" />}{row.descricao || row.tipo}</div><div className="text-xs text-muted-foreground">{row.tipo} · {row.id}</div></td><td className="p-3"><Badge variant={row.correspondencia_status === 'correspondente' ? 'secondary' : 'outline'}>{row.correspondencia_status === 'correspondente' ? 'Correspondente' : row.correspondencia_status === 'ambiguo' ? 'Ambíguo' : 'Sem correspondência'}</Badge></td><td className={`p-3 text-right font-medium tabular-nums ${row.valor < 0 ? 'text-destructive' : 'text-primary'}`}>{row.valor > 0 ? '+' : ''}{formatCurrency(Number(row.valor))}</td><td className="p-3 text-right tabular-nums">{formatCurrency(Number(row.saldo))}</td></tr>)}</tbody>
            </table>
            {!loading && !rows.length && <p className="p-10 text-center text-sm text-muted-foreground">{run?.state === 'failed' ? 'Não foi possível completar a leitura do Asaas.' : 'Nenhum movimento encontrado.'}</p>}
            {loading && <p className="p-10 text-center text-sm text-muted-foreground">Carregando extrato...</p>}
          </div>
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Página {page + 1} de {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Página anterior" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label="Próxima página" disabled={(page + 1) * PAGE_SIZE >= total || loading} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
        </section>
      </div>
      <ExtratoAsaasDetailSheet movement={selectedMovement} onClose={() => setSelectedMovement(null)} />
    </main>
  );
}
