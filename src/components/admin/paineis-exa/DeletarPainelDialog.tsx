import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeletarPainelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  painel: {
    id: string;
    numero_painel?: string;
    code?: string;
  } | null;
  onPainelDeletado: () => void;
}

export const DeletarPainelDialog = ({ 
  open, 
  onOpenChange, 
  painel,
  onPainelDeletado 
}: DeletarPainelDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleDeletar = async () => {
    if (!painel) return;

    setLoading(true);
    try {
      console.log('🗑️ Deletando painel:', painel.id);

      // Deletar painel (as tabelas relacionadas serão deletadas em cascata)
      const { error } = await supabase
        .from('painels')
        .delete()
        .eq('id', painel.id);

      if (error) throw error;

      console.log('✅ Painel deletado com sucesso');
      toast.success('Painel deletado com sucesso!');
      onOpenChange(false);
      onPainelDeletado();
    } catch (error: any) {
      console.error('❌ Erro ao deletar painel:', error);
      toast.error(error.message || 'Erro ao deletar painel');
    } finally {
      setLoading(false);
    }
  };

  if (!painel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Deletar Painel
          </DialogTitle>
          <DialogDescription>
            Esta ação é irreversível e removerá permanentemente todos os dados do painel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-destructive/10 p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Atenção! Ação Permanente</p>
                <p className="text-sm text-muted-foreground">
                  O painel <strong>"{painel.numero_painel || painel.code}"</strong> será completamente removido do sistema, incluindo:
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Histórico de conexões</li>
              <li>Comandos remotos</li>
              <li>Logs de status</li>
              <li>Vinculação com prédio</li>
              <li>Todas as configurações</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeletar}
              variant="destructive"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Deletando...' : 'Deletar Permanentemente'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
