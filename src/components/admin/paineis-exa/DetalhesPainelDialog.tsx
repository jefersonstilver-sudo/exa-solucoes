import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ExternalLink, Calendar, Wifi, WifiOff, Monitor, Link2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DetalhesPainelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  painel: {
    id: string;
    numero_painel?: string;
    code: string;
    status_vinculo?: string;
    status?: string;
    codigo_vinculacao?: string;
    link_instalacao?: string;
    token_acesso?: string;
    data_vinculacao?: string;
    primeira_conexao_at?: string;
    ultima_sync?: string;
    resolucao?: string;
    orientacao?: string;
    sistema_operacional?: string;
    ip_interno?: string;
    created_at: string;
    buildings?: {
      id: string;
      nome: string;
      endereco: string;
      bairro: string;
    };
  } | null;
}

export const DetalhesPainelDialog = ({ open, onOpenChange, painel }: DetalhesPainelDialogProps) => {
  const [copiado, setCopiado] = useState<string | null>(null);

  if (!painel) return null;

  const handleCopiar = (texto: string, tipo: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(tipo);
    toast.success('Copiado!');
    setTimeout(() => setCopiado(null), 2000);
  };

  const getStatusBadge = () => {
    if (painel.status_vinculo === 'aguardando_codigo') {
      return <Badge variant="secondary" className="gap-2"><WifiOff className="w-3 h-3" />Aguardando Código</Badge>;
    }
    if (painel.status_vinculo === 'conectado') {
      return <Badge className="bg-green-500 gap-2"><Wifi className="w-3 h-3" />Conectado</Badge>;
    }
    if (painel.status === 'desconectado') {
      return <Badge variant="destructive" className="gap-2"><WifiOff className="w-3 h-3" />Desconectado</Badge>;
    }
    return <Badge variant="outline">Não Vinculado</Badge>;
  };

  const linkCompleto = painel.link_instalacao && painel.codigo_vinculacao
    ? `${painel.link_instalacao}?exibir_codigo=${painel.codigo_vinculacao}`
    : painel.link_instalacao || 'N/A';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Detalhes do Painel {painel.numero_painel || painel.code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status e Informações Principais */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              {getStatusBadge()}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Código Interno</p>
              <p className="text-sm font-mono">{painel.code}</p>
            </div>
          </div>

          {/* Código de Vinculação - Destaque */}
          {painel.codigo_vinculacao && (
            <div className="bg-[#8B1538] text-white p-6 rounded-lg">
              <p className="text-sm font-medium opacity-90 mb-2">Código de Vinculação</p>
              <div className="flex items-center justify-between">
                <p className="text-4xl font-bold tracking-widest" style={{ fontFamily: 'monospace' }}>
                  {painel.codigo_vinculacao}
                </p>
                <Button
                  onClick={() => handleCopiar(painel.codigo_vinculacao!, 'codigo')}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  {copiado === 'codigo' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Link de Instalação */}
          {painel.link_instalacao && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Link de Instalação</p>
              <div className="flex gap-2">
                <input
                  value={linkCompleto}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted font-mono"
                />
                <Button
                  onClick={() => handleCopiar(linkCompleto, 'link')}
                  variant="outline"
                  size="icon"
                >
                  {copiado === 'link' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  onClick={() => window.open(linkCompleto, '_blank')}
                  variant="outline"
                  size="icon"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Prédio Vinculado */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Prédio Vinculado</p>
            {painel.buildings ? (
              <div className="p-3 border rounded-md bg-muted/50">
                <p className="font-medium">{painel.buildings.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {painel.buildings.endereco}, {painel.buildings.bairro}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nenhum prédio atribuído</p>
            )}
          </div>

          {/* Especificações Técnicas */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Especificações Técnicas</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-md">
                <p className="text-xs text-muted-foreground">Resolução</p>
                <p className="text-sm font-medium">{painel.resolucao || 'N/A'}</p>
              </div>
              <div className="p-3 border rounded-md">
                <p className="text-xs text-muted-foreground">Sistema Operacional</p>
                <p className="text-sm font-medium">{painel.sistema_operacional || 'N/A'}</p>
              </div>
              <div className="p-3 border rounded-md">
                <p className="text-xs text-muted-foreground">Orientação</p>
                <p className="text-sm font-medium capitalize">{painel.orientacao || 'N/A'}</p>
              </div>
              <div className="p-3 border rounded-md">
                <p className="text-xs text-muted-foreground">IP Interno</p>
                <p className="text-sm font-medium">{painel.ip_interno || 'N/A'}</p>
              </div>
            </div>

            {(painel as any).device_fingerprint && (
              <div className="mt-4 p-4 border rounded-md bg-green-50 dark:bg-green-950">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  🔒 Dispositivo Registrado
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fingerprint:</span>
                    <span className="font-mono text-xs">{((painel as any).device_fingerprint as string)?.substring(0, 20)}...</span>
                  </div>
                  {(painel as any).device_info?.platform && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plataforma:</span>
                      <span className="font-medium">{(painel as any).device_info.platform}</span>
                    </div>
                  )}
                  {(painel as any).device_info?.screenResolution && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolução:</span>
                      <span className="font-medium">{(painel as any).device_info.screenResolution}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Este painel está travado neste dispositivo e só reconectará automaticamente nele
                </p>
              </div>
            )}
          </div>

          {/* Histórico de Conexões */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Histórico de Conexões</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Criado:</span>
                <span>
                  {formatDistanceToNow(new Date(painel.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>

              {painel.primeira_conexao_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Primeira Conexão:</span>
                  <span>
                    {formatDistanceToNow(new Date(painel.primeira_conexao_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )}

              {painel.ultima_sync && (
                <div className="flex items-center gap-2 text-sm">
                  <Wifi className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Última Sincronização:</span>
                  <span>
                    {formatDistanceToNow(new Date(painel.ultima_sync), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Aviso se aguardando código */}
          {painel.status_vinculo === 'aguardando_codigo' && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                ⚠️ Painel aguardando conexão
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Abra o link no dispositivo e insira o código de 5 dígitos para conectar
              </p>
            </div>
          )}

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
