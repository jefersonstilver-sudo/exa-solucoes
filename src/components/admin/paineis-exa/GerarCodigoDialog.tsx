import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, QrCode, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';

interface GerarCodigoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const GerarCodigoDialog = ({ open, onOpenChange, onSuccess }: GerarCodigoDialogProps) => {
  const [buildingId, setBuildingId] = useState<string>('');
  const [codigo, setCodigo] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: buildings } = useQuery({
    queryKey: ['buildings-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      return data;
    },
  });

  const handleGerar = async () => {
    if (!buildingId) {
      toast.error('Selecione um prédio');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-codigo-vinculo', {
        body: { building_id: buildingId },
      });

      if (error) throw error;

      if (data?.success) {
        setCodigo(data.codigo);
        
        // Gerar QR Code
        const qrUrl = await QRCode.toDataURL(data.codigo, {
          width: 300,
          margin: 2,
        });
        setQrCodeUrl(qrUrl);

        toast.success('Código gerado com sucesso!');
      } else {
        throw new Error(data?.error || 'Erro ao gerar código');
      }
    } catch (error: any) {
      console.error('Erro ao gerar código:', error);
      toast.error(error.message || 'Erro ao gerar código');
    } finally {
      setLoading(false);
    }
  };

  const handleCopiar = () => {
    if (codigo) {
      navigator.clipboard.writeText(codigo);
      toast.success('Código copiado!');
    }
  };

  const handleClose = () => {
    setCodigo(null);
    setQrCodeUrl(null);
    setBuildingId('');
    onOpenChange(false);
    if (codigo) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Código de Vínculo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!codigo ? (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Selecione o Prédio</label>
                <Select value={buildingId} onValueChange={setBuildingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um prédio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings?.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGerar} 
                disabled={!buildingId || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  'Gerar Código'
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Código de Vínculo:</p>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-4xl font-bold text-primary tracking-wider">{codigo}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Válido por 24 horas</p>
              </div>

              {qrCodeUrl && (
                <div className="flex justify-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleCopiar} variant="outline" className="flex-1 gap-2">
                  <Copy className="h-4 w-4" />
                  Copiar Código
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
