import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, FileText, History, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

type Provider = { id: string; display_name: string; enabled: boolean };
type Account = { id: string; provider_id: string; holder_name: string; holder_document: string | null; account_label: string; enabled: boolean; access_state: string };
type Run = { id: string; scope: string; provider_id: string | null; account_id: string | null; state: string; expected_accounts: number; created_at: string; finished_at: string | null };
type Job = { id: string; run_id: string; account_id: string; state: string; counts: Record<string, number>; phase_changed_at: string };
type Contract = { id: string; account_id: string; external_contract_id: string; installation_address: string | null; last_verified_run_id: string | null };
type Invoice = { id: string; contract_id: string; competence: string | null; amount: number; due_date: string | null; portal_status: string; bank_status: string; last_verified_run_id: string | null; portal_observed_at: string | null };
type Exception = { id: string; run_id: string; account_id: string | null; code: string; state: string; safe_message: string; created_at: string };
type Observation = { id: string; run_id: string; invoice_id: string; portal_status: string; amount: number; due_date: string | null; observed_at: string };
type Document = { id: string; invoice_id: string; run_id: string; document_type: string; created_at: string };
type Snapshot = { providers: Provider[]; accounts: Account[]; runs: Run[]; jobs: Job[]; contracts: Contract[]; invoices: Invoice[]; exceptions: Exception[]; observations: Observation[]; documents: Document[]; links: { contract_id: string; building_id: string; state: string }[] };

const stateLabel: Record<string, string> = {
  queued: 'Aguardando', running: 'Em andamento', logging_in: 'Entrando', collecting_contracts: 'Coletando contratos',
  collecting_invoices: 'Coletando faturas', downloading_documents: 'Baixando documentos', reconciling: 'Conciliando',
  completed: 'Concluído', partial: 'Parcial', failed: 'Falhou', error: 'Erro', intervention_required: 'Intervenção necessária',
  not_configured: 'Não configurado', paid_portal: 'Paga no portal', overdue_open: 'Vencida / em aberto', upcoming: 'A vencer',
  cancelled_replaced: 'Cancelada / substituída', not_verified: 'Não verificada', review: 'Em revisão', verified_by_official_id: 'Conciliada por ID oficial',
};
const label = (value: string) => stateLabel[value] ?? value;
const date = (value?: string | null) => value ? new Date(value).toLocaleString('pt-BR') : '—';
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const mask = (value: string | null) => value ? `${'•'.repeat(Math.max(0, value.replace(/\D/g, '').length - 4))}${value.replace(/\D/g, '').slice(-4)}` : '—';

export function InternetAccountsSection() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [accountForm, setAccountForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['internet-accounts-admin'],
    queryFn: async () => {
      const { data: result, error } = await supabase.functions.invoke<Snapshot>('internet-accounts-admin', { method: 'GET' });
      if (error || !result) throw error ?? new Error('Unavailable');
      return result;
    },
    refetchInterval: 60000,
  });
  const run = data?.runs[0];
  const jobs = data?.jobs.filter(j => j.run_id === run?.id) ?? [];
  const invoices = data?.invoices.filter(i => i.last_verified_run_id === run?.id) ?? [];
  const unverified = (data?.contracts.filter(c => c.last_verified_run_id !== run?.id).length ?? 0) + jobs.filter(j => j.state === 'error' || j.state === 'intervention_required').length;
  const totals = [
    ['Vencido confirmado', invoices.filter(i => i.portal_status === 'overdue_open').reduce((s, i) => s + i.amount, 0), true],
    ['A vencer', invoices.filter(i => i.portal_status === 'upcoming').reduce((s, i) => s + i.amount, 0), true],
    ['Pagas no portal', invoices.filter(i => i.portal_status === 'paid_portal').length, false],
    ['Não verificadas', unverified, false],
    ['Exceções', data?.exceptions.filter(e => e.run_id === run?.id && e.state === 'open').length ?? 0, false],
  ] as const;
  const openDocument = async (documentId: string) => {
    const { data: result, error } = await supabase.functions.invoke<{ url: string }>('internet-document-access', { body: { document_id: documentId } });
    if (error || !result?.url) { toast.error('Documento indisponível.'); return; }
    window.open(result.url, '_blank', 'noopener,noreferrer');
  };
  const saveAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const body = { provider_id: String(form.get('provider_id')), holder_name: String(form.get('holder_name')), holder_document: String(form.get('holder_document')) || null, account_label: String(form.get('account_label')), external_account_id: String(form.get('external_account_id')) || null };
    const { error } = await supabase.functions.invoke('internet-accounts-admin', { body });
    if (error) toast.error('Não foi possível cadastrar a conta.');
    else { toast.success('Conta cadastrada sem credenciais e desabilitada para coleta.'); setAccountForm(false); await queryClient.invalidateQueries({ queryKey: ['internet-accounts-admin'] }); }
    setSaving(false);
  };
  const dispatch = async (scope: 'all' | 'provider' | 'account', id?: string) => {
    if (pending) return;
    setPending(true);
    try {
      const { data: response, error } = await supabase.functions.invoke<{ run?: Run }>('internet-collection-dispatch', {
        body: { scope, provider_id: scope === 'provider' ? id : null, account_id: scope === 'account' ? id : null, request_key: crypto.randomUUID() },
      });
      if (error || !response?.run) throw error ?? new Error('Unavailable');
      toast.info(response.run.state === 'not_configured' ? 'Nenhuma conta habilitada para coleta. Execução registrada sem resultados.' : 'Execução criada; aguardando coleta.');
      await queryClient.invalidateQueries({ queryKey: ['internet-accounts-admin'] });
    } catch { toast.error('Não foi possível iniciar a execução. Nenhum resultado foi presumido.'); }
    finally { setPending(false); }
  };

  return <section className="border-t border-border pt-6 space-y-5" aria-label="Contas de Internet / Conciliação">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><div className="flex items-center gap-2"><ShieldCheck className="text-primary size-5" /><h2 className="text-xl font-semibold text-foreground">Contas de Internet / Conciliação</h2></div>
        <p className="text-sm text-muted-foreground mt-1">Faturas dos portais · independente da conectividade dos painéis e da confirmação bancária</p></div>
      <Button onClick={() => dispatch('all')} disabled={pending || isLoading || isError}><RefreshCw className={pending ? 'animate-spin' : ''} />Conciliação atualizada</Button>
    </div>
    {isLoading && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="size-4 animate-spin" />Carregando contas...</p>}
    {isError && <p role="alert" className="text-sm text-destructive flex items-center gap-2"><AlertTriangle className="size-4" />Dados indisponíveis. Nenhum status pode ser confirmado agora.</p>}
    {data && <>
      <div className="text-xs text-muted-foreground">{run ? `Coleta ${run.id} · ${date(run.created_at)} · ${label(run.state)}` : 'Nenhuma coleta realizada'} · {jobs.filter(j => j.state === 'completed').length}/{run?.expected_accounts ?? 0} contas concluídas</div>
      {(!run || run.state === 'not_configured') && <p className="text-sm border border-border bg-muted/30 p-4 rounded-md">Nenhuma conta preparada para coleta. Não há faturas ou estados atuais verificados.</p>}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">{totals.map(([title, amount, currency]) => <div key={title} className="border border-border bg-card rounded-md p-3 min-w-0"><p className="text-xs text-muted-foreground">{title}</p><strong className="text-lg text-foreground">{run && run.state !== 'not_configured' && run.state !== 'queued' ? currency ? money(amount) : amount : '—'}</strong></div>)}</div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Visão geral / contratos</TabsTrigger><TabsTrigger value="accounts">Contas dos provedores</TabsTrigger><TabsTrigger value="runs">Execuções / Histórico</TabsTrigger><TabsTrigger value="exceptions">Exceções</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="overflow-x-auto">
          {!data.contracts.length ? <p className="text-sm text-muted-foreground py-6">Nenhum contrato coletado.</p> : <table className="w-full text-sm text-left min-w-[850px]"><thead className="text-muted-foreground border-b border-border"><tr>{['Provedor / conta','Contrato / instalação','Competência','Valor','Vencimento','Portal','Banco','Última consulta','Histórico'].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead><tbody>{data.contracts.flatMap(contract => {
            const account = data.accounts.find(a => a.id === contract.account_id);
            const provider = data.providers.find(p => p.id === account?.provider_id);
            const rows = data.invoices.filter(i => i.contract_id === contract.id);
            return (rows.length ? rows : [null]).map(invoice => <tr key={invoice?.id ?? contract.id} className="border-b border-border/60"><td className="p-3">{provider?.display_name ?? '—'}<div className="text-xs text-muted-foreground">{account?.account_label ?? '—'}</div></td><td className="p-3">{contract.external_contract_id}<div className="text-xs text-muted-foreground">{contract.installation_address ?? '—'}</div></td><td className="p-3">{invoice?.competence ?? '—'}</td><td className="p-3">{invoice ? money(invoice.amount) : '—'}</td><td className="p-3">{invoice?.due_date ?? '—'}</td><td className="p-3">{invoice?.last_verified_run_id === run?.id ? label(invoice.portal_status) : 'Não verificada nesta execução'}</td><td className="p-3">{invoice ? label(invoice.bank_status) : '—'}</td><td className="p-3">{date(invoice?.portal_observed_at)}</td><td className="p-3">{invoice && <Button variant="ghost" size="icon" title="Histórico da fatura" onClick={() => setSelectedInvoice(invoice.id)}><History /></Button>}</td></tr>);
          })}</tbody></table>}
          {selectedInvoice && <div className="border border-border rounded-md p-4 mt-4 text-sm space-y-2"><div className="flex items-center justify-between"><strong>Histórico da fatura</strong><Button size="sm" variant="ghost" onClick={() => setSelectedInvoice(null)}>Fechar</Button></div>
            {(data.observations ?? []).filter(o => o.invoice_id === selectedInvoice).map(o => <p key={o.id}>{date(o.observed_at)} · {label(o.portal_status)} · {money(o.amount)} · coleta {o.run_id}</p>)}
            {!(data.observations ?? []).some(o => o.invoice_id === selectedInvoice) && <p className="text-muted-foreground">Sem observações anteriores.</p>}
            {(data.documents ?? []).filter(d => d.invoice_id === selectedInvoice).map(d => <Button key={d.id} variant="outline" size="sm" onClick={() => openDocument(d.id)}><FileText />{d.document_type === 'receipt' ? 'Comprovante oficial' : 'Fatura oficial'}</Button>)}
          </div>}
        </TabsContent>
        <TabsContent value="accounts" className="space-y-2"><Button variant="outline" size="sm" onClick={() => setAccountForm(!accountForm)}>{accountForm ? 'Fechar cadastro' : 'Cadastrar conta sem credencial'}</Button>
          {accountForm && <form onSubmit={saveAccount} className="grid sm:grid-cols-2 gap-3 border border-border p-4 rounded-md max-w-2xl">
            <div className="space-y-1"><Label htmlFor="provider_id">Provedor</Label><select id="provider_id" name="provider_id" required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{data.providers.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}</select></div>
            {[['holder_name','Titular'],['holder_document','CNPJ / documento'],['account_label','Identificação da conta'],['external_account_id','ID oficial da conta (se conhecido)']].map(([name, title]) => <div key={name} className="space-y-1"><Label htmlFor={name}>{title}</Label><Input id={name} name={name} required={name === 'holder_name' || name === 'account_label'} maxLength={name === 'holder_document' ? 24 : 120} /></div>)}
            <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar conta'}</Button></div>
          </form>}
          {data.providers.map(provider => <div key={provider.id} className="border-b border-border py-3"><div className="flex items-center justify-between gap-3"><strong>{provider.display_name}</strong><Button size="sm" variant="outline" disabled={pending || !data.accounts.some(a => a.provider_id === provider.id && a.enabled)} onClick={() => dispatch('provider', provider.id)}><RefreshCw />Reconciliar novamente</Button></div>{data.accounts.filter(a => a.provider_id === provider.id).map(account => <div key={account.id} className="flex items-center justify-between gap-3 py-2 pl-3 text-sm"><span>{account.holder_name} · {mask(account.holder_document)} · {account.account_label}<span className="block text-xs text-muted-foreground">{account.enabled ? label(account.access_state) : 'Desabilitada'}</span></span><Button size="sm" variant="ghost" disabled={pending || !account.enabled} onClick={() => dispatch('account', account.id)} title="Reconciliar esta conta"><RefreshCw /></Button></div>)}{!data.accounts.some(a => a.provider_id === provider.id) && <p className="text-sm text-muted-foreground mt-2">Nenhuma conta cadastrada.</p>}</div>)}</TabsContent>
        <TabsContent value="runs" className="space-y-2">{data.runs.length ? data.runs.map(r => <div key={r.id} className="border-b border-border py-3 text-sm"><div className="flex items-center gap-2"><History className="size-4 text-muted-foreground" /><strong>{label(r.state)}</strong><span className="text-muted-foreground">{date(r.created_at)}</span></div><p className="text-xs text-muted-foreground break-all mt-1">{r.id} · {data.jobs.filter(j => j.run_id === r.id && j.state === 'completed').length}/{r.expected_accounts} contas concluídas</p>{data.jobs.filter(j => j.run_id === r.id).map(j => <p key={j.id} className="text-xs pl-6 py-1">{data.accounts.find(a => a.id === j.account_id)?.account_label ?? j.account_id}: {label(j.state)} · {date(j.phase_changed_at)}</p>)}</div>) : <p className="text-sm text-muted-foreground py-6">Nenhuma execução anterior.</p>}</TabsContent>
        <TabsContent value="exceptions">{data.exceptions.length ? data.exceptions.map(e => <p key={e.id} className="text-sm border-b border-border py-3"><AlertTriangle className="size-4 inline mr-2 text-destructive" />{e.safe_message} · {label(e.state)} · {date(e.created_at)}</p>) : <p className="text-sm text-muted-foreground py-6">Nenhuma exceção registrada.</p>}</TabsContent>
      </Tabs>
    </>}
  </section>;
}
