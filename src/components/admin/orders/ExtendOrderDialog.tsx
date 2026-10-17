import React, { useMemo, useState } from 'react';
import { CalendarClock, Loader2, Infinity as InfinityIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const INDEFINITE_END = '2099-12-31';
export const isIndefiniteEnd = (d?: string | null) => !!d && d.slice(0, 10) >= INDEFINITE_END;

const TERMINAL = ['finalizado', 'bloqueado', 'cancelado', 'cancelado_automaticamente'];

const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentEnd?: string | null;
  status: string;
  onDone?: () => void;
}

type Mode = 'add' | 'date' | 'indefinite';

export const ExtendOrderDialog: React.FC<Props> = ({ open, onOpenChange, orderId, currentEnd, status, onDone }) => {
  const [mode, setMode] = useState<Mode>('add');
  const [months, setMonths] = useState<number>(1);
  const [days, setDays] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const todayISO = toISO(new Date());
  const isTerminal = TERMINAL.includes(status);

  const newEnd = useMemo(() => {
    if (mode === 'indefinite') return INDEFINITE_END;
    if (mode === 'date') return date || null;
    // Somar a partir do término atual, ou de hoje se já venceu / indeterminado
    const baseStr = currentEnd && !isIndefiniteEnd(currentEnd) && currentEnd.slice(0, 10) >= todayISO
      ? currentEnd.slice(0, 10) : todayISO;
    const [y, m, d] = baseStr.split('-').map(Number);
    const base = new Date(y, m - 1, d);
    const extraDays = parseInt(days, 10);
    if (days && Number.isFinite(extraDays) && extraDays > 0) base.setDate(base.getDate() + extraDays);
    else base.setMonth(base.getMonth() + months);
    return toISO(base);
  }, [mode, date, months, days, currentEnd, todayISO]);

  const fmt = (iso: string) => isIndefiniteEnd(iso) ? 'Indeterminado' : iso.split('-').reverse().join('/');

  const handleSave = async () => {
    if (saving) return;
    if (!newEnd || newEnd < todayISO) {
      toast.error('Escolha uma data final válida (hoje ou depois)');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await (supabase as any).rpc('admin_extend_reactivate_order', {
        p_pedido_id: orderId, p_new_end: newEnd, p_reactivate: true,
      });
      if (error) throw error;
      const message = data?.reactivated
        ? `Pedido reativado até ${fmt(newEnd)}`
        : `Vigência atualizada até ${fmt(newEnd)}`;
      // The database change is already committed. An AWS failure must never
      // be presented as a failed extension or roll back confirmed schedules.
      try {
        const { data: sync, error: syncError } = await supabase.functions.invoke('audit-sync-all-active-orders', {
          body: { pedido_id: orderId, source: 'order_extension' },
        });
        if (syncError) {
          const details = syncError instanceof FunctionsHttpError ? await syncError.context.text() : syncError.message;
          throw new Error(details);
        }
        if (sync?.failed || !sync?.success) throw new Error(sync?.details?.find((item: { error?: string }) => item.error)?.error || 'Reenvio não confirmado');
        if (sync?.pending) toast.warning(`${message}. Envio aceito pela AWS; processamento ainda pendente.`);
        else if (!sync?.synced) toast.warning(`${message}. Nenhum vídeo foi reenviado; confira os prédios e vídeos aprovados.`);
        else toast.success(`${message}. Vídeos reenviados para os prédios vinculados.`);
      } catch (syncError: unknown) {
        console.error('[ORDER_EXTENSION] AWS sync failed:', syncError);
        toast.error(`${message}, mas o reenvio AWS falhou. Tente novamente pela Auditoria Geral API (AWS).`);
      }
      onOpenChange(false);
      onDone?.();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao estender pedido');
    } finally {
      setSaving(false);
    }
  };

  const tab = (m: Mode, label: string) => (
    <Button type="button" size="sm" variant={mode === m ? 'default' : 'outline'} className="flex-1 text-xs" onClick={() => setMode(m)}>
      {label}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Estender / Reativar pedido</DialogTitle>
          <DialogDescription className="text-xs">
            Término atual: <strong>{currentEnd ? fmt(currentEnd.slice(0, 10)) : 'N/A'}</strong>. Nenhuma cobrança será gerada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          {tab('add', 'Somar tempo')}
          {tab('date', 'Nova data')}
          {tab('indefinite', 'Indeterminado')}
        </div>

        {mode === 'add' && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 6, 12].map((m) => (
                <Button key={m} type="button" size="sm" variant={!days && months === m ? 'default' : 'outline'} className="text-xs"
                  onClick={() => { setMonths(m); setDays(''); }}>
                  +{m} {m === 1 ? 'mês' : 'meses'}
                </Button>
              ))}
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ou somar dias</label>
              <Input type="number" min={1} placeholder="Ex.: 15" value={days} onChange={(e) => setDays(e.target.value)} />
            </div>
          </div>
        )}

        {mode === 'date' && (
          <div>
            <label className="text-xs text-muted-foreground">Nova data de término</label>
            <Input type="date" min={todayISO} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}

        {mode === 'indefinite' && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <InfinityIcon className="h-4 w-4" /> O pedido fica ativo sem data de término até você alterar.
          </p>
        )}

        <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
          <p>Novo término: <strong>{newEnd ? fmt(newEnd) : '—'}</strong></p>
          {isTerminal && <p className="text-xs">Este pedido está <strong>{status}</strong> e voltará a ficar <strong>Ativo</strong>, com os vídeos aprovados de volta nas telas.</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !newEnd}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isTerminal ? 'Reativar pedido' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
