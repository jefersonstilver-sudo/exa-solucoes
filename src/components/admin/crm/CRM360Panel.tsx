import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveTable } from '@/components/admin/common/ResponsiveTable';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { activeOrdersFirst, crmDate, crmPhone, crm360HeaderPhone, fetchCRM360, type CRM360Lookup, type CRM360Order } from '@/services/crm360';

const money = (value: number | null | undefined) => value == null ? 'Não informado' : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export default function CRM360Panel({ lookup }: { lookup: CRM360Lookup }) {
  const { basePath } = useAdminBasePath();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['crm360', lookup], queryFn: () => fetchCRM360(lookup), staleTime: 60000, retry: false });
  if (isLoading) return <div className="flex items-center justify-center gap-2 py-16"><Loader2 className="h-5 w-5 animate-spin" />Carregando ficha 360...</div>;
  if (error || !data) return <div role="alert" className="space-y-3 py-8 text-sm"><p>{error?.message || 'Ficha indisponível.'}</p><Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></div>;
  const { contato, contas, resumo, alertas } = data;
  const first = contas[0];
  const fields = [
    ['Cliente desde', crmDate(resumo.cliente_desde)], ['Conta criada em', crmDate(resumo.conta_criada_em)],
    ['Total de pedidos', resumo.total_pedidos], ['Pedidos ativos', resumo.pedidos_ativos],
    ['Valor dos ativos', money(resumo.valor_ativos)], ['Última compra', crmDate(resumo.ultima_compra)],
  ];
  return <div className="space-y-6 min-w-0">
    {(alertas.length > 0 || contas.length > 1) && <div role="alert" className="rounded-lg border border-crm-warning/30 bg-crm-warning/10 p-4 text-crm-warning-foreground">
      <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 shrink-0" />{contas.length > 1 ? 'Várias contas — unificar' : 'Alertas'}</div>
      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm break-words">{alertas.map((text, i) => <li key={i}>{text}</li>)}</ul>
    </div>}
    <header className="space-y-2">
      <h2 className="text-xl font-semibold break-words">{contato?.nome || first?.nome || 'Nome não informado'}</h2>
      <p className="text-sm text-muted-foreground break-words">{contato?.empresa || first?.empresa || 'Empresa não informada'}</p>
      <p className="text-sm">{crm360HeaderPhone(data)}</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{resumo.total_pedidos > 0 || contato?.papel === 'cliente' ? 'Cliente' : 'Lead'}</Badge>
        <Badge variant="outline" className={resumo.pedidos_ativos > 0 ? 'bg-crm-success/10 text-crm-success border-crm-success/30' : 'text-muted-foreground'}>{resumo.pedidos_ativos > 0 ? 'Pedido ativo' : 'Sem pedido ativo'}</Badge>
        <Badge variant="outline" className={resumo.email_verificado ? 'text-crm-success border-crm-success/30' : 'text-crm-warning-foreground border-crm-warning/30'}>{resumo.email_verificado ? 'E-mail verificado' : 'E-mail NÃO verificado'}</Badge>
        {(resumo.telefone_verificado_sofia || contas.some(c => c.whatsapp_verificado)) && <Badge variant="outline" className="text-crm-success border-crm-success/30">WhatsApp verificado</Badge>}
      </div>
    </header>
    <dl className="grid grid-cols-2 lg:grid-cols-3 gap-4 border-y py-5">{fields.map(([label, value]) => <div key={String(label)} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium break-words">{value ?? 'Não informado'}</dd></div>)}</dl>
    <section className="space-y-3"><h3 className="text-base font-semibold">Contas do site</h3>
      {contas.length === 0 ? <div className="text-sm text-muted-foreground"><p>Este contato ainda não tem conta no site</p><p className="mt-1 break-all">E-mail informado: {contato?.email_informado || 'Não informado'}</p></div> : contas.map(c => <article key={c.id} className="rounded-lg border p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="font-medium break-words">{c.nome || 'Nome não informado'}</p><p className="text-sm break-all">{c.email || 'E-mail não informado'}</p></div><Badge variant={c.bloqueada ? 'destructive' : 'secondary'}>{c.bloqueada ? 'Bloqueada' : 'Não bloqueada'}</Badge></div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm"><div><dt className="text-muted-foreground">Telefone / WhatsApp</dt><dd>{crmPhone(c.whatsapp || c.telefone)}</dd></div><div><dt className="text-muted-foreground">E-mail verificado em</dt><dd>{c.email_verificado ? crmDate(c.email_verificado_em) : 'Não verificado'}</dd></div><div><dt className="text-muted-foreground">Conta criada em</dt><dd>{crmDate(c.conta_criada_em)}</dd></div><div><dt className="text-muted-foreground">Pedidos</dt><dd>{c.pedidos ?? 'Não informado'}</dd></div></dl>
        <Button variant="outline" size="sm" asChild><Link to={`${basePath}/usuarios?user=${encodeURIComponent(c.id)}`}>Abrir no Usuários</Link></Button>
      </article>)}
    </section>
    <section className="space-y-3"><h3 className="text-base font-semibold">Pedidos</h3><ResponsiveTable<CRM360Order> data={activeOrdersFirst(data.pedidos)} keyExtractor={o => o.id} emptyMessage="Nenhum pedido encontrado" columns={[
      { key: 'name', label: 'Pedido', render: o => <span className="break-words">{o.nome_pedido || o.id}</span> },
      { key: 'status', label: 'Status', render: o => <Badge variant="outline">{o.status}</Badge> },
      { key: 'origin', label: 'Origem', render: o => <Badge variant="secondary">{o.origem}</Badge> },
      { key: 'value', label: 'Valor', render: o => money(o.valor_total) },
      { key: 'plan', label: 'Plano', render: o => o.plano_meses == null ? 'Não informado' : `${o.plano_meses} meses` },
      { key: 'dates', label: 'Início / fim', render: o => <span>{crmDate(o.data_inicio)} / {crmDate(o.data_fim)}</span> },
      { key: 'contract', label: 'Contrato', render: o => o.contrato_status || 'Não informado' },
      { key: 'email', label: 'E-mail', render: o => <span className="break-all">{o.email || 'Não informado'}</span> },
      { key: 'phone', label: 'WhatsApp', render: o => crmPhone(o.whatsapp) },
      { key: 'action', label: 'Abrir', render: o => <Button size="sm" variant="outline" asChild><Link to={`${basePath}/pedidos/${o.id}`}>Abrir pedido</Link></Button> },
    ]} /></section>
  </div>;
}