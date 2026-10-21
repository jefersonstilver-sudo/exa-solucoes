import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isDeleteConfirmationValid } from '@/lib/deleteContactRules';

export type DeleteContactTarget = { contactId: string | null; name: string; phone: string | null; loading?: boolean };

interface Props {
  target: DeleteContactTarget | null;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteContactDialog: React.FC<Props> = ({ target, onClose, onDeleted }) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (target) setText(''); }, [target?.contactId]);

  const confirm = async () => {
    if (!target?.contactId || !isDeleteConfirmationValid(text)) return;
    setBusy(true);
    try {
      const { data, error } = await (supabase.rpc as any)('crm_apagar_contato', { p_contact: target.contactId, p_confirm: text.trim() });
      if (error) throw new Error(error.message);
      const d = (data || {}) as { conversas?: number; mensagens?: number };
      toast.success(`Contato apagado: ${d.conversas ?? 0} conversas e ${d.mensagens ?? 0} mensagens removidas`);
      onDeleted();
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível apagar o contato');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={Boolean(target)} onOpenChange={(o) => { if (!o && !busy) onClose(); }}>
      <AlertDialogContent className="border-destructive/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Apagar contato e historico?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Ao apagar, a Sofia perde todo o entendimento e o historico desta pessoa (conversas, mensagens, videos de teste e anotacoes). Se esse numero mandar mensagem de novo, ela sera tratada como uma pessoa NOVA. Esta acao nao pode ser desfeita. Contatos com conta de cliente, pedido ou contrato nao podem ser apagados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <div className="font-semibold">{target?.name || 'Sem nome'}</div>
          <div className="text-muted-foreground">{target?.phone ? `+${target.phone}` : 'Telefone nao identificado'}</div>
        </div>
        <label className="block text-sm font-medium">
          Digite deletar para confirmar
          <Input className="mt-1" value={text} onChange={(e) => setText(e.target.value)} placeholder="deletar" autoComplete="off" disabled={busy} />
        </label>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={busy || target?.loading || !target?.contactId || !isDeleteConfirmationValid(text)}>
            {busy || target?.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apagar definitivamente'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteContactDialog;
