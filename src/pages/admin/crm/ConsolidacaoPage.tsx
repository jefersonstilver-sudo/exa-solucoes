import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveTable } from '@/components/admin/common/ResponsiveTable';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { fetchInconsistencies, inconsistencyLookup, type CRMInconsistency } from '@/services/crm360';

const labels: Record<string, string> = { telefone_em_varias_contas: 'Telefone em várias contas', contato_sofia_sem_conta: 'Contato Sofia sem conta', pedido_sem_whatsapp: 'Pedido sem WhatsApp', pedido_sem_email: 'Pedido sem e-mail' };
export default function ConsolidacaoPage() {
  const { basePath } = useAdminBasePath();
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['crm-inconsistencias'], queryFn: fetchInconsistencies, staleTime: 60000, retry: false });
  const groups = Array.from(new Set([...Object.keys(labels), ...data.map(r => r.tipo)]));
  return <main className="p-4 md:p-6 space-y-6"><Helmet><title>Consolidação | EXA Admin</title></Helmet><header className="flex flex-wrap justify-between items-center gap-3"><div><h1 className="text-2xl font-semibold">Consolidação</h1><p className="text-sm text-muted-foreground">Somente leitura</p></div><Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button></header>
    {isLoading ? <div className="flex items-center gap-2 py-12"><Loader2 className="h-5 w-5 animate-spin" />Carregando inconsistências...</div> : error ? <p role="alert">{error.message}</p> : <>
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-y py-4">{groups.map(type => <div key={type}><dt className="text-sm text-muted-foreground">{labels[type] || type}</dt><dd className="text-2xl font-semibold">{data.filter(r => r.tipo === type).length}</dd></div>)}</dl>
      {groups.map(type => <section key={type} className="space-y-3"><h2 className="text-lg font-semibold">{labels[type] || type}</h2><ResponsiveTable<CRMInconsistency> data={data.filter(r => r.tipo === type)} keyExtractor={r => `${r.tipo}:${r.chave}`} emptyMessage="Nenhuma inconsistência encontrada" columns={[
        { key: 'key', label: 'Identificação', render: r => <span className="break-all">{r.chave}</span> },
        { key: 'detail', label: 'Detalhe', render: r => <span className="break-words">{r.detalhe}</span> },
        { key: 'count', label: 'Quantidade', render: r => r.qtd },
        { key: 'action', label: 'Ficha', render: r => <Button variant="outline" size="sm" asChild><Link to={`${basePath}/crm-360?${new URLSearchParams(inconsistencyLookup(r))}`}>Ver ficha 360</Link></Button> },
      ]} /></section>)}
    </>}
  </main>;
}