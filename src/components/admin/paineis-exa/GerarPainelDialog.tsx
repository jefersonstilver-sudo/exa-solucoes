import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, Check, QrCode, ExternalLink } from 'lucide-react';

interface GerarPainelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPainelGerado: () => void;
}

export const GerarPainelDialog = ({ open, onOpenChange, onPainelGerado }: GerarPainelDialogProps) => {
  const [numeroPainel, setNumeroPainel] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkGerado, setLinkGerado] = useState('');
  const [copiado, setCopiado] = useState(false);

  const handleCriarPainel = async () => {
    if (!numeroPainel.trim()) {
      toast.error('Digite o número do painel');
      return;
    }

    setLoading(true);
    try {
      console.log('🔵 Criando painel:', numeroPainel);

      const { data, error } = await supabase.functions.invoke('criar-novo-painel', {
        body: { numero_painel: numeroPainel.trim() }
      });

      if (error) throw error;

      if (data?.success) {
        console.log('✅ Painel criado:', data);
        setLinkGerado(data.link_instalacao);
        toast.success('Painel criado com sucesso!');
      } else {
        throw new Error(data?.error || 'Erro ao criar painel');
      }
    } catch (error: any) {
      console.error('❌ Erro ao criar painel:', error);
      toast.error(error.message || 'Erro ao criar painel');
    } finally {
      setLoading(false);
    }
  };

  const handleCopiarLink = () => {
    navigator.clipboard.writeText(linkGerado);
    setCopiado(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleFechar = () => {
    setNumeroPainel('');
    setLinkGerado('');
    setCopiado(false);
    onOpenChange(false);
    if (linkGerado) {
      onPainelGerado();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleFechar}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Gerar Novo Painel EXA
          </DialogTitle>
          <DialogDescription>
            {linkGerado 
              ? 'Link de instalação gerado com sucesso!'
              : 'Digite um número único para identificar este painel'
            }
          </DialogDescription>
        </DialogHeader>

        {!linkGerado ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número do Painel</Label>
              <Input
                id="numero"
                placeholder="Ex: 001, 002, 123..."
                value={numeroPainel}
                onChange={(e) => setNumeroPainel(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                maxLength={10}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                Use apenas números ou letras (máx. 10 caracteres)
              </p>
            </div>

            <Button
              onClick={handleCriarPainel}
              disabled={loading || !numeroPainel.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? 'Gerando...' : 'Gerar Painel'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Link de instalação */}
            <div className="space-y-2">
              <Label>Link de Instalação</Label>
              <div className="flex gap-2">
                <Input
                  value={linkGerado}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleCopiarLink}
                  variant="outline"
                  size="icon"
                >
                  {copiado ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  onClick={() => window.open(linkGerado, '_blank')}
                  variant="outline"
                  size="icon"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Instruções */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">📋 Próximos passos:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Copie o link acima ou abra diretamente no dispositivo</li>
                <li>No Chrome/Edge, clique em "Instalar app"</li>
                <li>O painel EXA abrirá em modo fullscreen</li>
                <li>Aguarde até aparecer "Conectado" na tela</li>
                <li>Use o código de vínculo para conectar a um prédio</li>
              </ol>
            </div>

            {/* QR Code placeholder */}
            <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-dashed">
              <div className="text-center text-muted-foreground">
                <QrCode className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p className="text-sm">QR Code aqui</p>
                <p className="text-xs">(implementar biblioteca qrcode)</p>
              </div>
            </div>

            <Button onClick={handleFechar} className="w-full" size="lg">
              Concluir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
