import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPixData, checkPixStatus, markOrderPaidFromAsaas } from '@/services/adminOrderPix';

interface Props {
  pedidoId: string;
  pix: AdminPixData;
  onPaid?: () => void;
}

const AsaasPixPanel: React.FC<Props> = ({ pedidoId, pix, onPaid }) => {
  const [status, setStatus] = useState<string>('PENDING');
  const [paid, setPaid] = useState(false);
  const [checking, setChecking] = useState(false);
  const busy = useRef(false);

  const verify = useCallback(async (manual = false) => {
    if (busy.current || paid) return;
    busy.current = true; setChecking(true);
    try {
      const r = await checkPixStatus(pix.payment_id);
      setStatus(r.status);
      if (r.paid) {
        await markOrderPaidFromAsaas(pedidoId, r.status);
        setPaid(true);
        toast.success('Pagamento confirmado');
        onPaid?.();
      } else if (manual) {
        toast.info(`Status Asaas: ${r.status}`);
      }
    } catch (e: any) {
      if (manual) toast.error(e?.message || 'Erro ao verificar pagamento');
    } finally {
      busy.current = false; setChecking(false);
    }
  }, [pix.payment_id, pedidoId, paid, onPaid]);

  useEffect(() => {
    if (paid) return;
    verify();
    const t = setInterval(() => verify(), 10000);
    return () => clearInterval(t);
  }, [verify, paid]);

  const copy = async () => {
    if (!pix.copia_e_cola) return;
    await navigator.clipboard.writeText(pix.copia_e_cola);
    toast.success('Código PIX copiado');
  };

  if (paid) {
    return (
      <div className="flex flex-col items-center text-center gap-2 py-6">
        <CheckCircle2 className="h-12 w-12 text-[#9C1E1E]" />
        <p className="font-semibold">Pagamento confirmado</p>
        <p className="text-xs text-muted-foreground">Asaas: {status} · pedido atualizado para aguardando vídeo</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">PIX via Asaas</h4>
      {pix.qr_base64 ? (
        <img
          src={pix.qr_base64.startsWith('data:') ? pix.qr_base64 : `data:image/png;base64,${pix.qr_base64}`}
          alt="QR Code PIX"
          className="w-48 h-48 mx-auto rounded-lg border bg-background p-2"
        />
      ) : (
        <p className="text-xs text-muted-foreground">QR code não disponível nesta sessão. Use o link da fatura ou verifique o pagamento.</p>
      )}
      {pix.copia_e_cola && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Copia e cola</p>
          <div className="flex gap-2">
            <code className="flex-1 text-[10px] break-all bg-muted rounded p-2 max-h-20 overflow-y-auto">{pix.copia_e_cola}</code>
            <Button size="sm" variant="outline" onClick={copy}><Copy className="h-3.5 w-3.5 mr-1" />Copiar</Button>
          </div>
        </div>
      )}
      <div className="text-xs space-y-1">
        {pix.vencimento && <p><span className="text-muted-foreground">Vencimento:</span> {new Date(pix.vencimento + (pix.vencimento.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR')}</p>}
        <p><span className="text-muted-foreground">Status Asaas:</span> {status}</p>
        {pix.invoice_url && (
          <a href={pix.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#9C1E1E] hover:underline">
            Abrir fatura <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={() => verify(true)} disabled={checking}>
        {checking ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
        Verificar pagamento
      </Button>
      <p className="text-[10px] text-muted-foreground text-center">Verificação automática a cada 10 segundos. O pedido só é marcado como pago após confirmação do Asaas.</p>
    </div>
  );
};

export default AsaasPixPanel;
