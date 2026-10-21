import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';
import { readAsaasAudit } from '@/services/asaasAuditService';
import { readAsaasStatus } from '@/services/asaasPaymentService';

export default function AsaasPaymentAuditPanel() {
  const [audit, setAudit] = useState<Awaited<ReturnType<typeof readAsaasAudit>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const query = async (single: boolean) => {
    if (loading) return;
    setLoading(true); setError(null); setStatus(null);
    try {
      if (single) setStatus((await readAsaasStatus(paymentId.trim())).status);
      else setAudit(await readAsaasAudit());
    } catch (e) { setError(e instanceof Error ? e.message : 'Consulta indisponível'); }
    finally { setLoading(false); }
  };
  return <Card>
    <CardHeader><CardTitle>Verificação de pagamentos · Asaas</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input aria-label="ID oficial da cobrança Asaas" placeholder="pay_…" value={paymentId} onChange={e => setPaymentId(e.target.value)} className="w-full sm:w-72" />
        <Button onClick={() => query(true)} disabled={loading || !paymentId}><RefreshCw className="mr-2 h-4 w-4" />Consultar status</Button>
        <Button variant="outline" onClick={() => query(false)} disabled={loading}>Consultar cobranças e eventos</Button>
      </div>
      {loading && <p role="status">Consultando Asaas…</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {status && <p>Status oficial Asaas: <strong>{status}</strong></p>}
      {audit && <div className="space-y-2 text-sm">
        <p>{audit.charges.length} cobranças · {audit.events.length} eventos · {audit.unmatched.length} cobranças sem evento correspondente</p>
        <p className="text-muted-foreground">Conciliação bancária não certificada · Última consulta: {new Date(audit.timestamp).toLocaleString('pt-BR')}</p>
        <div className="max-h-80 overflow-auto"><table className="w-full text-left"><thead><tr><th>ID Asaas</th><th>Status</th><th>Valor</th></tr></thead><tbody>
          {audit.charges.map(charge => <tr key={charge.id} className="border-t"><td className="py-2 break-all">{charge.asaas_id}</td><td>{charge.status}</td><td>{Number(charge.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>)}
        </tbody></table></div>
      </div>}
      <p className="text-sm text-muted-foreground">Baixas e correções automáticas desativadas. Recebimento de evento não comprova conciliação bancária.</p>
    </CardContent>
  </Card>;
}