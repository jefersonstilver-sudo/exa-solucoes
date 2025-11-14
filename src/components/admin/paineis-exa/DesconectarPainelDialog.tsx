import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface DesconectarPainelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  painel: {
    id: string;
    numero_painel: string;
    status_vinculo?: string;
  } | null;
  onPainelDesconectado: () => void;
}

export const DesconectarPainelDialog = ({ 
  open, 
  onOpenChange, 
  painel,
  onPainelDesconectado 
}: DesconectarPainelDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleDesconectar = async () => {
    if (!painel) return;

    setLoading(true);
    try {
      console.log('🔵 Desconectando painel:', painel.id);

      const { data, error } = await supabase.functions.invoke('desconectar-painel', {
        body: { painel_id: painel.id }
      });

      if (error) throw error;

      if (data?.success) {
        console.log('✅ Painel desconectado:', data);
        toast.success('Painel desconectado com sucesso!');
        onOpenChange(false);
        onPainelDesconectado();
      } else {
        throw new Error(data?.error || 'Erro ao desconectar painel');
      }
    } catch (error: any) {
      console.error('❌ Erro ao desconectar painel:', error);
      toast.error(error.message || 'Erro ao desconectar painel');
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
            <WifiOff className="w-5 h-5 text-destructive" />
            Desconectar Painel
          </DialogTitle>
          <DialogDescription>
            Esta ação irá desconectar o painel e gerar um novo código de vinculação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-destructive/10 p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Atenção!</p>
                <p className="text-sm text-muted-foreground">
                  O painel <strong>"{painel.numero_painel}"</strong> será completamente desconectado e perderá acesso ao sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium">O que acontecerá:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>O painel será desconectado imediatamente</li>
              <li>Um novo código de vinculação será gerado</li>
              <li>O prédio atribuído será removido</li>
              <li>Status mudará para "Aguardando Código"</li>
              <li>Será necessário vincular novamente com o novo código</li>
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
              onClick={handleDesconectar}
              variant="destructive"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Desconectando...' : 'Desconectar Painel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
