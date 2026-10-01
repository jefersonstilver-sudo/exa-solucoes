import { useEffect, useState } from 'react';
import { ExternalLink, FileDown, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/format';

type Movement = { id: string; data: string; tipo: string; descricao: string | null; valor: number; saldo: number; correspondencia_status: string };
type Details = {
  id: string;
  references: Record<string, string | null>;
  statementFields: Record<string, string | number | boolean | null>;
  details: Record<string, string | number | boolean | null>;
  available: string[];
  unavailable: { resource: string; status: number }[];
};
const labels: Record<string, string> = {
  status: 'Situação', operation: 'Operação', grossValue: 'Valor bruto', fee: 'Taxa', netValue: 'Valor líquido',
  createdAt: 'Criada em', requestedAt: 'Solicitada / agendada', effectiveAt: 'Efetivada em', description: 'Descrição oficial',
  endToEnd: 'End-to-End Pix', name: 'Destinatário / pagador', document: 'CPF / CNPJ', bank: 'Instituição',
  agency: 'Agência', account: 'Conta', pixKey: 'Chave Pix (protegida)', recurring: 'Pix recorrente',
  recurrenceId: 'ID da recorrência', externalReference: 'Referência externa',
};
const referenceLabels: Record<string, string> = { transferId: 'Transferência', paymentId: 'Cobrança', billId: 'Conta', pixTransactionId: 'Transação Pix' };
const statementLabels: Record<string, string> = { invoiceId: 'Fatura', splitId: 'Divisão', anticipationId: 'Antecipação', paymentDunningId: 'Cobrança de inadimplência', creditBureauReportId: 'Consulta de crédito' };
const resourceLabels: Record<string, string> = { transfer: 'Transferência', payment: 'Cobrança', bill: 'Conta', pix: 'Pix' };
const dateText = (s: string) => /^\d{4}-\d\d-\d\d/.test(s) ? new Date(s.length === 10 ? `${s}T12:00:00` : s).toLocaleString('pt-BR', s.length === 10 ? { dateStyle: 'short' } : { dateStyle: 'short', timeStyle: 'short' }) : s;
const display = (key: string, value: string | number | boolean) => {
  if (['grossValue', 'fee', 'netValue'].includes(key) && typeof value === 'number') return formatCurrency(value);
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (['createdAt', 'requestedAt', 'effectiveAt'].includes(key)) return dateText(String(value));
  return String(value);
};

export default function ExtratoAsaasDetailSheet({ movement, onClose }: { movement: Movement | null; onClose: () => void }) {
  const [detail, setDetail] = useState<Details | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!movement) { setDetail(null); return; }
    let cancelled = false;
    setLoading(true); setError(false); setDetail(null);
    void supabase.functions.invoke('get-asaas-statement-detail', { body: { id: movement.id } }).then(({ data, error: requestError }) => {
      if (cancelled) return;
      if (requestError || !data?.details) setError(true);
      else setDetail(data as Details);
    }).catch(() => { if (!cancelled) setError(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [movement?.id]);
  const receiptUrl = detail?.details.receiptUrl;
  const receipt = typeof receiptUrl === 'string' && receiptUrl.startsWith('https://') ? receiptUrl : null;
  return (
    <Sheet open={!!movement} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <SheetHeader className="border-b px-6 pb-5 pt-7 text-left">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Extrato Asaas · Detalhes</p>
          <SheetTitle className="pr-8 text-xl">{movement?.descricao || movement?.tipo || 'Movimento'}</SheetTitle>
          <SheetDescription>{movement?.data ? dateText(movement.data) : ''} · {movement?.tipo}</SheetDescription>
        </SheetHeader>
        {movement && <div className="space-y-7 px-6 py-6">
          <div className="border-b pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Valor do movimento</span><span className="text-2xl font-semibold tabular-nums">{movement.valor > 0 ? '+' : ''}{formatCurrency(Number(movement.valor))}</span></div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Saldo após movimento</span><span className="text-sm font-medium tabular-nums">{formatCurrency(Number(movement.saldo))}</span></div>
            <p className="mt-3 break-all text-xs text-muted-foreground">ID do movimento · {movement.id}</p>
          </div>
          {loading && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Consultando detalhes no Asaas...</p>}
          {error && <p role="alert" className="rounded-md border border-destructive/30 p-4 text-sm text-destructive">Detalhes adicionais indisponíveis no momento. Os dados do extrato acima continuam disponíveis.</p>}
          {detail && <>
            {detail.available.length ? <div className="flex flex-wrap gap-2">{detail.available.map(name => <Badge variant="secondary" key={name}>{resourceLabels[name] || name} consultada</Badge>)}</div> : <p className="text-sm text-muted-foreground">Detalhes adicionais indisponíveis para este movimento.</p>}
            {receipt && <div className="flex flex-wrap gap-2"><Button asChild><a href={receipt} target="_blank" rel="noopener noreferrer">Visualizar comprovante <ExternalLink className="ml-2 h-4 w-4" /></a></Button><Button variant="outline" asChild><a href={receipt} target="_blank" rel="noopener noreferrer" download>Baixar <FileDown className="ml-2 h-4 w-4" /></a></Button></div>}
            {Object.entries(detail.details).some(([key, val]) => key !== 'receiptUrl' && val !== null && val !== '') && <section><h3 className="mb-3 text-sm font-semibold">Informações oficiais</h3><dl className="divide-y border-y">{Object.entries(detail.details).filter(([key, val]) => key !== 'receiptUrl' && val !== null && val !== '').map(([key, val]) => <div key={key} className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]"><dt className="text-xs text-muted-foreground">{labels[key] || key}</dt><dd className="break-words text-sm font-medium">{display(key, val as string | number | boolean)}</dd></div>)}</dl></section>}
            {Object.values(detail.references).some(Boolean) && <section><h3 className="mb-3 text-sm font-semibold">Identificadores Asaas</h3><dl className="space-y-3">{Object.entries(detail.references).filter(([, val]) => !!val).map(([key, val]) => <div key={key}><dt className="text-xs text-muted-foreground">{referenceLabels[key] || key}</dt><dd className="break-all text-sm">{val}</dd></div>)}</dl></section>}
            {Object.keys(detail.statementFields || {}).length > 0 && <section><h3 className="mb-3 text-sm font-semibold">Outras referências do extrato</h3><dl className="space-y-3">{Object.entries(detail.statementFields).map(([key, val]) => <div key={key}><dt className="text-xs text-muted-foreground">{statementLabels[key] || key}</dt><dd className="break-all text-sm">{String(val)}</dd></div>)}</dl></section>}
            {detail.unavailable.length > 0 && <p className="border-t pt-4 text-xs text-muted-foreground">Detalhes adicionais indisponíveis: {detail.unavailable.map(item => resourceLabels[item.resource] || item.resource).join(', ')}.</p>}
          </>}
        </div>}
      </SheetContent>
    </Sheet>
  );
}
