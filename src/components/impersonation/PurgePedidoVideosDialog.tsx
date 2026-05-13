import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PurgePedidoVideosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: string;
  /** A confirmation phrase the admin must type. Use client name/email or order ID. */
  expectedConfirmation: string;
  onPurged?: () => void;
}

const PurgePedidoVideosDialog: React.FC<PurgePedidoVideosDialogProps> = ({
  open, onOpenChange, pedidoId, expectedConfirmation, onPurged,
}) => {
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);

  const matches = typed.trim().toLowerCase() === (expectedConfirmation || '').trim().toLowerCase();

  const handlePurge = async () => {
    if (!matches) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-purge-pedido-videos', {
        body: { pedido_id: pedidoId, confirmation: typed.trim() },
      });
      if (error) throw error;
      toast.success(`${(data as any)?.deleted_count ?? 0} vídeo(s) excluído(s).`);
      onPurged?.();
      onOpenChange(false);
      setTyped('');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao excluir vídeos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo: excluir TODOS os vídeos
          </DialogTitle>
          <DialogDescription>
            Esta ação remove todos os vídeos deste pedido do banco de dados, do Storage e da AWS.
            Não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="confirm-purge" className="text-sm">
            Para confirmar, digite: <span className="font-mono font-semibold">{expectedConfirmation}</span>
          </Label>
          <Input
            id="confirm-purge"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={expectedConfirmation}
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handlePurge} disabled={!matches || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Excluir tudo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurgePedidoVideosDialog;
