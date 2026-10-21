import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, QrCode, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AsaasPixPanel from './AsaasPixPanel';
import { AdminPixData, checkPixStatus, findExistingPix, generateOrderPix, getCachedPix, markOrderPaidFromAsaas } from '@/services/adminOrderPix';
import { formatCpfCnpj, isValidCpfCnpj } from '@/utils/cpfCnpjValidator';

interface Props {
  order: { id: string; status?: string; type?: string; valor_total?: number; client_name?: string; email?: string; client_id?: string };
  onChanged?: () => void;
  className?: string;
}

export const OrderPixActions: React.FC<Props> = ({ order, onChanged, className }) => {
  const [open, setOpen] = useState(false);
  const [pix, setPix] = useState<AdminPixData | null>(() => getCachedPix(order.id));
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [doc, setDoc] = useState('');
  const [phone, setPhone] = useState('');

  const isPending = order.status === 'pendente' || order.status === 'pending';
  const isOrder = !order.type || order.type === 'order';

  useEffect(() => {
    if (!open || pix) return;
    findExistingPix(order.id).then(p => p && setPix(p));
    if (order.client_id) {
      supabase.from('users').select('cpf, empresa_documento, telefone').eq('id', order.client_id).maybeSingle()
        .then(({ data }) => {
          if (!data) return;
          setDoc(prev => prev || formatCpfCnpj(data.empresa_documento || data.cpf || ''));
          setPhone(prev => prev || data.telefone || '');
        });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isPending || !isOrder) return null;

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const generate = async () => {
    if (!isValidCpfCnpj(doc)) { toast.error('CPF/CNPJ inválido'); return; }
    if (!order.valor_total || order.valor_total <= 0) { toast.error('Pedido sem valor total'); return; }
    setLoading(true);
    try {
      const p = await generateOrderPix({
        pedidoId: order.id, name: order.client_name || '', cpfCnpj: doc, email: order.email || '', phone,
        value: order.valor_total, description: `Pedido EXA ${order.id.slice(0, 8)}`,
      });
      setPix(p);
      toast.success('PIX gerado no Asaas');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao gerar PIX');
    } finally { setLoading(false); }
  };

  const verifyNow = async (e: React.MouseEvent) => {
    stop(e);
    setVerifying(true);
    try {
      const existing = pix || await findExistingPix(order.id);
      if (!existing) { toast.info('Nenhuma cobrança PIX gerada para este pedido'); return; }
      const r = await checkPixStatus(existing.payment_id);
      if (r.paid) {
        await markOrderPaidFromAsaas(order.id, r.status);
        toast.success('Pagamento confirmado');
        onChanged?.();
      } else toast.info(`Status Asaas: ${r.status}`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao verificar pagamento');
    } finally { setVerifying(false); }
  };

  return (
    <div className={`flex gap-2 ${className || ''}`} onClick={stop} onPointerDown={stop}>
      <Button size="sm" className="h-8 text-xs bg-[#9C1E1E] hover:bg-[#7D1818] text-white" onClick={() => setOpen(true)}>
        <QrCode className="h-3.5 w-3.5 mr-1" />{pix ? 'Ver PIX' : 'Gerar PIX'}
      </Button>
      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={verifyNow} disabled={verifying}>
        {verifying ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
        Verificar pagamento
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" onClick={stop}>
          <DialogHeader>
            <DialogTitle>PIX do pedido #{order.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              {order.client_name} · R$ {(order.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </DialogDescription>
          </DialogHeader>
          {pix ? (
            <AsaasPixPanel pedidoId={order.id} pix={pix} onPaid={onChanged} />
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-sm">CPF/CNPJ do cliente *</Label>
                <Input value={doc} onChange={e => setDoc(formatCpfCnpj(e.target.value))} placeholder="000.000.000-00" />
                {doc && !isValidCpfCnpj(doc) && <p className="text-xs text-destructive mt-1">CPF/CNPJ inválido</p>}
              </div>
              <div>
                <Label className="text-sm">Telefone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <Button className="w-full bg-[#9C1E1E] hover:bg-[#7D1818] text-white" onClick={generate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
                Gerar PIX via Asaas
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderPixActions;
