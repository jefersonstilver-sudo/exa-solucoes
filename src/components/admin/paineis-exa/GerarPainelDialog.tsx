import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, Check, QrCode, ExternalLink, CheckCircle2, Info } from 'lucide-react';

interface GerarPainelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPainelGerado: () => void;
}

export const GerarPainelDialog = ({ open, onOpenChange, onPainelGerado }: GerarPainelDialogProps) => {
  const [numeroPainel, setNumeroPainel] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkGerado, setLinkGerado] = useState('');
  const [codigoVinculacao, setCodigoVinculacao] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [loadingProximoNumero, setLoadingProximoNumero] = useState(false);

  // Buscar próximo número disponível quando abrir o dialog
  useEffect(() => {
    if (open && !numeroPainel) {
      buscarProximoNumero();
    }
  }, [open]);

  const buscarProximoNumero = async () => {
    setLoadingProximoNumero(true);
    try {
      const { data, error } = await supabase
        .from('painels')
        .select('numero_painel')
        .not('numero_painel', 'is', null)
        .order('numero_painel', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const ultimoNumero = parseInt(data[0].numero_painel) || 0;
        const proximoNumero = (ultimoNumero + 1).toString().padStart(3, '0');
        setNumeroPainel(proximoNumero);
      } else {
        setNumeroPainel('001');
      }
    } catch (error) {
      console.error('Erro ao buscar próximo número:', error);
      setNumeroPainel('001');
    } finally {
      setLoadingProximoNumero(false);
    }
  };

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
        console.log('🔑 Código de vinculação recebido:', data.codigo_vinculacao);
        
        // Verificar se o código foi gerado
        if (!data.codigo_vinculacao) {
          console.error('❌ Código de vinculação não foi gerado!');
          throw new Error('Código de vinculação não foi gerado');
        }
        
        // Salvar link E código separadamente (não expor na URL)
        setLinkGerado(data.link_instalacao);
        setCodigoVinculacao(data.codigo_vinculacao);
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
    setCodigoVinculacao('');
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
                disabled={loadingProximoNumero}
              />
              <p className="text-sm text-muted-foreground">
                {loadingProximoNumero 
                  ? 'Buscando próximo número disponível...'
                  : 'Use apenas números ou letras (máx. 10 caracteres)'
                }
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
            {/* Código de vinculação em destaque */}
            <div className="bg-[#8B1538] text-white p-6 rounded-lg text-center space-y-2">
              <p className="text-sm font-medium opacity-90">Código de Vinculação</p>
              <p className="text-5xl font-bold tracking-widest" style={{ fontFamily: 'monospace' }}>
                {codigoVinculacao || 'ERRO'}
              </p>
              <p className="text-xs opacity-75">Informe este código ao dispositivo</p>
            </div>

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
                  onClick={() => window.open(linkGerado.split('?')[0], '_blank')}
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
                <li>Abra o link no dispositivo do painel (TV/Monitor)</li>
                <li>Digite o código de 5 dígitos exibido acima</li>
                <li>Aguarde a confirmação da conexão</li>
                <li>O painel estará disponível para atribuição de prédio</li>
              </ol>
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
